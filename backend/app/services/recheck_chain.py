from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import json
import time
from typing import Optional

from sqlalchemy.orm import Session

from app.models.ai_report import AIReport
from app.models.human_review_case import HumanReviewCase
from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.risk_signal import RiskSignal
from app.services.ai_investigation_service import generate_risk_report
from app.services.audit_service import log_event
from app.services.hash_diff_service import hash_changed, sha256_text
from app.services.payment_provider_service import lower_payout_limit
from app.services.vector_diff_service import semantic_distance
from app.services.website_intel_service import WebsiteIntel, crawl_merchant_site


def _tier_step(tier: int, name: str, status: str, detail: str, duration_ms: int = 0) -> dict:
    return {"tier": tier, "name": name, "status": status, "detail": detail, "duration_ms": duration_ms}


@dataclass
class RecheckContext:
    """Encapsulates state flowing through the 4-tier recheck chain."""
    db: Session
    merchant: Merchant
    trigger_reason: str
    baseline: Optional[MerchantSnapshot]
    latest_intel: Optional[WebsiteIntel] = None
    latest_hash: str = ""
    semantic_distance: float = 0.0
    tier_reached: int = 1
    status: str = "PENDING"
    result_summary: str = ""
    cost_saved: float = 0.0
    tier_details: list[dict] = field(default_factory=list)
    is_spike: bool = False
    halted: bool = False


# ══════════════════════════════════════════════════════════════════════
# CHAIN OF RESPONSIBILITY PATTERN: 4-Tier Recheck Handlers
# ══════════════════════════════════════════════════════════════════════

class RecheckTierHandler(ABC):
    """
    Abstract Handler in the Chain of Responsibility.
    Demonstrates:
      - Chain of Responsibility: Decouples sequential filtering stages.
      - Short-Circuiting: Inexpensive tiers halt evaluation early to minimize latency and LLM cost.
    """
    def __init__(self):
        self._next_handler: Optional["RecheckTierHandler"] = None

    def set_next(self, handler: "RecheckTierHandler") -> "RecheckTierHandler":
        self._next_handler = handler
        return handler

    def handle(self, ctx: RecheckContext) -> RecheckContext:
        should_continue = self._process(ctx)
        if should_continue and not ctx.halted and self._next_handler:
            return self._next_handler.handle(ctx)
        return ctx

    @abstractmethod
    def _process(self, ctx: RecheckContext) -> bool:
        """Process current tier. Return True to continue to next tier, False to halt."""
        pass


class Tier1AvailabilityHandler(RecheckTierHandler):
    """
    Tier 1: Website Availability Check (HTTP Ping / DOM Fetch).
    Cost: ~0.00ms LLM, $0.
    """
    def _process(self, ctx: RecheckContext) -> bool:
        t0 = time.time()
        ctx.latest_intel = crawl_merchant_site(
            ctx.merchant.website_url,
            [
                ctx.merchant.refund_policy_url,
                ctx.merchant.shipping_policy_url,
                ctx.merchant.privacy_policy_url,
                ctx.merchant.terms_url,
            ],
        )
        ms = int((time.time() - t0) * 1000)
        ctx.latest_hash = sha256_text(ctx.latest_intel.html)
        ctx.is_spike = any(k in ctx.trigger_reason.lower() for k in ("spike", "event", "grace period"))

        if not ctx.latest_intel.available:
            ctx.tier_details.append(
                _tier_step(1, "Website Availability", "failed", f"HTTP {ctx.latest_intel.status_code} — site unreachable", ms)
            )
            ctx.tier_reached = 1
            ctx.status = "SERVICE_UNREACHABLE"
            ctx.result_summary = f"Website unavailable during recheck. HTTP {ctx.latest_intel.status_code}. Merchant is not rejected automatically."
            ctx.db.add(
                RiskSignal(
                    merchant_id=ctx.merchant.id,
                    level="medium",
                    source="crawler",
                    reason_code="SERVICE_UNREACHABLE",
                    description=ctx.result_summary,
                )
            )
            log_event(ctx.db, ctx.merchant.id, "Website availability", ctx.result_summary)
            ctx.halted = True
            return False

        ctx.tier_details.append(
            _tier_step(1, "Website Availability", "passed", f"HTTP {ctx.latest_intel.status_code} · {len(ctx.latest_intel.fetched_urls)} pages crawled", ms)
        )
        return True


class Tier2HashDiffHandler(RecheckTierHandler):
    """
    Tier 2: SHA-256 Byte-level Content Hash Diff.
    Cost: ~0.001ms, $0.
    Short-circuits if HTML hasn't changed by a single byte.
    """
    def _process(self, ctx: RecheckContext) -> bool:
        t0 = time.time()
        if not ctx.is_spike and ctx.baseline and not hash_changed(ctx.baseline.html_hash, ctx.latest_hash):
            ms = int((time.time() - t0) * 1000) + 20
            ctx.tier_details.append(
                _tier_step(2, "Hash Comparison", "no_change", "SHA-256 hash matches baseline — no content change detected", ms)
            )
            ctx.tier_reached = 2
            ctx.status = "NO_CHANGE"
            ctx.result_summary = "Tier 2 hash matched baseline. No content drift. AI call avoided."
            ctx.cost_saved = 0.08
            log_event(ctx.db, ctx.merchant.id, "Hash diff result", "NO_CHANGE")
            ctx.halted = True
            return False

        ms = int((time.time() - t0) * 1000) + 20
        if ctx.is_spike:
            ctx.tier_details.append(
                _tier_step(2, "Hash Comparison", "warning", "Bypassing hash check due to anomalous event (Spike detected)", ms)
            )
        else:
            base_preview = (ctx.baseline.html_hash[:12] + "...") if ctx.baseline else "N/A"
            ctx.tier_details.append(
                _tier_step(2, "Hash Comparison", "changed", f"SHA-256 mismatch · Baseline: {base_preview} → Latest: {ctx.latest_hash[:12]}...", ms)
            )
        return True


class Tier3SemanticDriftHandler(RecheckTierHandler):
    """
    Tier 3: Cosine Similarity Vector Semantic Analysis.
    Cost: ~2ms, $0.
    Short-circuits if semantic content distance is negligible (< 0.10).
    """
    def _process(self, ctx: RecheckContext) -> bool:
        t0 = time.time()
        base_text = ctx.baseline.website_text if ctx.baseline else ""
        current_text = ctx.latest_intel.text if ctx.latest_intel else ""
        distance = semantic_distance(base_text, current_text)
        ctx.semantic_distance = distance
        ms = int((time.time() - t0) * 1000) + 30

        # Persist snapshot of latest crawl
        ctx.db.add(
            MerchantSnapshot(
                merchant_id=ctx.merchant.id,
                kind="latest",
                html_hash=ctx.latest_hash,
                website_text=current_text,
                policy_text=ctx.latest_intel.policy_text if ctx.latest_intel else "",
                product_summary=ctx.latest_intel.product_summary if ctx.latest_intel else "",
                price_summary=ctx.latest_intel.price_summary if ctx.latest_intel else "",
                support_summary=ctx.latest_intel.support_summary if ctx.latest_intel else "",
                semantic_drift_score=distance,
            )
        )

        if not ctx.is_spike and distance < 0.10:
            ctx.tier_details.append(
                _tier_step(3, "Semantic Drift Analysis", "benign", f"Cosine distance {distance:.3f} — negligible drift, likely formatting changes", ms)
            )
            ctx.tier_reached = 3
            ctx.status = "COMPLETED"
            ctx.result_summary = f"Benign semantic drift ({distance:.3f}). Baseline can be updated."
            ctx.cost_saved = 0.05
            log_event(ctx.db, ctx.merchant.id, "Vector diff result", ctx.result_summary)
            ctx.halted = True
            return False

        if not ctx.is_spike and distance < 0.25:
            ctx.tier_details.append(
                _tier_step(3, "Semantic Drift Analysis", "warning", f"Cosine distance {distance:.3f} — moderate drift, watchlist recommended", ms)
            )
            ctx.tier_reached = 3
            ctx.status = "WATCHLIST"
            ctx.result_summary = f"Moderate semantic drift ({distance:.3f}). Watchlist signal created."
            ctx.db.add(
                RiskSignal(
                    merchant_id=ctx.merchant.id,
                    level="medium",
                    source="vector_diff",
                    reason_code="MODERATE_DRIFT",
                    description=ctx.result_summary,
                )
            )
            ctx.halted = True
            return False

        detail_msg = f"Cosine distance {distance:.3f} — significant content change detected, escalating to AI"
        if ctx.is_spike:
            detail_msg = "Forced AI escalation due to event trigger (Spike detected)"

        ctx.tier_details.append(_tier_step(3, "Semantic Drift Analysis", "escalated", detail_msg, ms))
        return True


class Tier4LLMInvestigationHandler(RecheckTierHandler):
    """
    Tier 4: Deep LLM Risk Investigation.
    Cost: ~1500ms, ~$0.005.
    Invoked strictly when earlier filters confirm genuine semantic drift or fraud spikes.
    """
    def _process(self, ctx: RecheckContext) -> bool:
        t0 = time.time()
        kyc_summary = (
            f"Business: {ctx.merchant.legal_business_name} ({ctx.merchant.business_type})\n"
            f"Stakeholder: {ctx.merchant.stakeholder_name} (PAN: {ctx.merchant.stakeholder_pan})\n"
            f"PAN: {ctx.merchant.pan} | GSTIN: {ctx.merchant.gst}\n"
            f"Category: {ctx.merchant.category}\n"
            f"Bank: {ctx.merchant.bank_account} (IFSC: {ctx.merchant.ifsc})"
        )
        report = generate_risk_report(
            merchant_name=ctx.merchant.legal_business_name,
            trigger=ctx.trigger_reason,
            source_text=ctx.latest_intel.text if ctx.latest_intel else "",
            source_url=str(ctx.merchant.website_url),
            kyc_data=kyc_summary,
        )
        ms = int((time.time() - t0) * 1000)

        ctx.tier_details.append(
            _tier_step(
                4,
                "AI Deep Investigation",
                "flagged" if report.risk_score > 60 else "cleared",
                f"LLM risk score: {report.risk_score} · Recommendation: {report.decision_recommendation} · {len(report.evidence)} evidence items",
                ms,
            )
        )

        ctx.tier_reached = 4
        ctx.status = "AI_REVIEW"
        ctx.result_summary = f"Tier 4 AI report generated. Risk: {report.risk_level}. Recommendation: {report.decision_recommendation}."

        # Dynamically recalculate merchant trust score & risk
        ctx.merchant.trust_score = min(ctx.merchant.trust_score, max(0, 100 - report.risk_score))
        if ctx.merchant.trust_score >= 85:
            ctx.merchant.risk_level = "low"
        elif ctx.merchant.trust_score >= 60:
            ctx.merchant.risk_level = "medium"
        elif ctx.merchant.trust_score >= 40:
            ctx.merchant.risk_level = "high"
        else:
            ctx.merchant.risk_level = "critical"

        if ctx.merchant.risk_level in {"high", "critical"}:
            ctx.merchant.status = "RESTRICTED"

        ctx.merchant.payout_limit = lower_payout_limit(ctx.merchant.payout_limit, report.risk_level)

        ctx.db.add(
            RiskSignal(
                merchant_id=ctx.merchant.id,
                level=report.risk_level,
                source="llm",
                reason_code="HIGH_RISK_SPIKE",
                description=ctx.result_summary,
            )
        )
        ctx.db.add(
            AIReport(
                merchant_id=ctx.merchant.id,
                risk_score=report.risk_score,
                risk_level=report.risk_level,
                decision_recommendation=report.decision_recommendation,
                reason_codes="|".join(report.reason_codes),
                evidence=report.model_dump_json(),
                underwriter_memo=report.underwriter_memo,
                merchant_message=report.merchant_message,
            )
        )
        ctx.db.add(
            HumanReviewCase(
                merchant_id=ctx.merchant.id,
                suggested_action=report.decision_recommendation,
                memo=report.underwriter_memo,
            )
        )
        log_event(ctx.db, ctx.merchant.id, "AI report generated", report.underwriter_memo)
        return True


def build_default_recheck_chain() -> RecheckTierHandler:
    """Factory function constructing the 4-tier Chain of Responsibility."""
    t1 = Tier1AvailabilityHandler()
    t2 = Tier2HashDiffHandler()
    t3 = Tier3SemanticDriftHandler()
    t4 = Tier4LLMInvestigationHandler()

    t1.set_next(t2).set_next(t3).set_next(t4)
    return t1
