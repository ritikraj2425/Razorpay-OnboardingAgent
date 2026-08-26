import json
import time
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.ai_report import AIReport
from app.models.human_review_case import HumanReviewCase
from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.recheck_job import RecheckJob
from app.models.risk_signal import RiskSignal
from app.services.ai_investigation_service import generate_risk_report
from app.services.audit_service import log_event
from app.services.hash_diff_service import hash_changed, sha256_text
from app.services.payment_provider_service import lower_payout_limit
from app.services.vector_diff_service import semantic_distance
from app.services.website_intel_service import crawl_merchant_site


def _tier_step(tier: int, name: str, status: str, detail: str, duration_ms: int = 0) -> dict:
    return {"tier": tier, "name": name, "status": status, "detail": detail, "duration_ms": duration_ms}


def run_recheck(db: Session, merchant_id: int, trigger_reason: str) -> RecheckJob:
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise ValueError("Merchant not found")
    baseline = (
        db.query(MerchantSnapshot)
        .filter(MerchantSnapshot.merchant_id == merchant_id, MerchantSnapshot.kind == "baseline")
        .order_by(MerchantSnapshot.id.asc())
        .first()
    )

    tier_details: list[dict] = []

    # ── Tier 1: Website Availability ──
    t0 = time.time()
    latest = crawl_merchant_site(
        merchant.website_url,
        [merchant.refund_policy_url, merchant.shipping_policy_url, merchant.privacy_policy_url, merchant.terms_url],
    )
    ms = int((time.time() - t0) * 1000)
    latest_hash = sha256_text(latest.text)

    job = RecheckJob(
        merchant_id=merchant_id,
        trigger_reason=trigger_reason,
        next_check_due=(datetime.utcnow() + timedelta(days=7)).isoformat(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    log_event(db, merchant_id, "Recheck triggered", trigger_reason)

    if not latest.available:
        tier_details.append(_tier_step(1, "Website Availability", "failed", f"HTTP {latest.status_code} — site unreachable", ms))
        job.tier_reached = 1
        job.status = "SERVICE_UNREACHABLE"
        job.result_summary = f"Website unavailable during recheck. HTTP {latest.status_code}. Merchant is not rejected automatically."
        job.tier_details = json.dumps(tier_details)
        db.add(RiskSignal(merchant_id=merchant_id, level="medium", source="crawler", reason_code="SERVICE_UNREACHABLE", description=job.result_summary))
        log_event(db, merchant_id, "Website availability", job.result_summary)
        db.commit()
        db.refresh(job)
        return job

    tier_details.append(_tier_step(1, "Website Availability", "passed", f"HTTP {latest.status_code} · {len(latest.fetched_urls)} pages crawled", ms))

    # ── Tier 2: Hash Comparison ──
    t0 = time.time()
    if baseline and not hash_changed(baseline.html_hash, latest_hash):
        ms = int((time.time() - t0) * 1000) + 20
        tier_details.append(_tier_step(2, "Hash Comparison", "no_change", "SHA-256 hash matches baseline — no content change detected", ms))
        job.tier_reached = 2
        job.status = "NO_CHANGE"
        job.result_summary = "Tier 2 hash matched baseline. No content drift. AI call avoided."
        job.cost_saved = 0.08
        job.tier_details = json.dumps(tier_details)
        db.commit()
        log_event(db, merchant_id, "Hash diff result", "NO_CHANGE")
        return job

    ms = int((time.time() - t0) * 1000) + 20
    tier_details.append(_tier_step(2, "Hash Comparison", "changed", f"SHA-256 mismatch · Baseline: {(baseline.html_hash[:12] + '...') if baseline else 'N/A'} → Latest: {latest_hash[:12]}...", ms))

    # ── Tier 3: Semantic Drift Analysis ──
    t0 = time.time()
    distance = semantic_distance(baseline.website_text if baseline else "", latest.text)
    ms = int((time.time() - t0) * 1000) + 30

    db.add(
        MerchantSnapshot(
            merchant_id=merchant_id,
            kind="latest",
            html_hash=latest_hash,
            website_text=latest.text,
            policy_text=latest.policy_text,
            product_summary=latest.product_summary,
            price_summary=latest.price_summary,
            support_summary=latest.support_summary,
            semantic_drift_score=distance,
        )
    )

    if distance < 0.10:
        tier_details.append(_tier_step(3, "Semantic Drift Analysis", "benign", f"Cosine distance {distance:.3f} — negligible drift, likely formatting changes", ms))
        job.tier_reached = 3
        job.status = "COMPLETED"
        job.result_summary = f"Benign semantic drift ({distance:.3f}). Baseline can be updated."
        job.cost_saved = 0.05
        job.tier_details = json.dumps(tier_details)
        log_event(db, merchant_id, "Vector diff result", job.result_summary)
    elif distance < 0.25:
        tier_details.append(_tier_step(3, "Semantic Drift Analysis", "warning", f"Cosine distance {distance:.3f} — moderate drift, watchlist recommended", ms))
        job.tier_reached = 3
        job.status = "WATCHLIST"
        job.result_summary = f"Moderate semantic drift ({distance:.3f}). Watchlist signal created."
        job.tier_details = json.dumps(tier_details)
        db.add(RiskSignal(merchant_id=merchant_id, level="medium", source="vector_diff", reason_code="MODERATE_DRIFT", description=job.result_summary))
    else:
        tier_details.append(_tier_step(3, "Semantic Drift Analysis", "escalated", f"Cosine distance {distance:.3f} — significant content change detected, escalating to AI", ms))

        # ── Tier 4: AI Deep Investigation ──
        t0 = time.time()
        report = generate_risk_report(merchant.legal_business_name, trigger_reason, latest.text, merchant.website_url)
        ms = int((time.time() - t0) * 1000)
        tier_details.append(_tier_step(4, "AI Deep Investigation", "flagged" if report.risk_score > 60 else "cleared", f"LLM risk score: {report.risk_score} · Recommendation: {report.decision_recommendation} · {len(report.evidence)} evidence items", ms))

        job.tier_reached = 4
        job.status = "AI_REVIEW"
        job.result_summary = f"Tier 4 AI report generated. Risk: {report.risk_level}. Recommendation: {report.decision_recommendation}."
        merchant.risk_level = report.risk_level
        merchant.status = "RESTRICTED" if report.risk_level in {"high", "critical"} else merchant.status
        merchant.payout_limit = lower_payout_limit(merchant.payout_limit, report.risk_level)
        db.add(RiskSignal(merchant_id=merchant_id, level=report.risk_level, source="llm", reason_code="HIGH_SEMANTIC_DRIFT", description=job.result_summary))
        db.add(
            AIReport(
                merchant_id=merchant_id,
                risk_score=report.risk_score,
                risk_level=report.risk_level,
                decision_recommendation=report.decision_recommendation,
                reason_codes="|".join(report.reason_codes),
                evidence=report.model_dump_json(),
                underwriter_memo=report.underwriter_memo,
                merchant_message=report.merchant_message,
            )
        )
        db.add(HumanReviewCase(merchant_id=merchant_id, suggested_action=report.decision_recommendation, memo=report.underwriter_memo))
        log_event(db, merchant_id, "AI report generated", report.underwriter_memo)

    job.tier_details = json.dumps(tier_details)
    db.commit()
    db.refresh(job)
    return job
