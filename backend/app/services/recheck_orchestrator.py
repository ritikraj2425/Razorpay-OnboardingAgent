from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.ai_report import AIReport
from app.models.human_review_case import HumanReviewCase
from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.recheck_job import RecheckJob
from app.models.risk_signal import RiskSignal
from app.services.ai_investigation_service import generate_mock_report
from app.services.audit_service import log_event
from app.services.hash_diff_service import hash_changed, sha256_text
from app.services.mock_razorpay_service import lower_payout_limit
from app.services.vector_diff_service import semantic_distance
from app.services.website_intel_service import mock_site_for


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

    drift = "stylebazaar" in merchant.business_name.lower() or "gadgetflash" in merchant.business_name.lower()
    latest = mock_site_for(merchant.business_name, merchant.category, drift=drift)
    latest_hash = sha256_text(latest.html)
    job = RecheckJob(
        merchant_id=merchant_id,
        trigger_reason=trigger_reason,
        next_check_due=(datetime.utcnow() + timedelta(days=7)).isoformat(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    log_event(db, merchant_id, "Recheck triggered", trigger_reason)

    if baseline and not hash_changed(baseline.html_hash, latest_hash):
        job.tier_reached = 2
        job.status = "NO_CHANGE"
        job.result_summary = "Tier 2 hash matched baseline. AI call avoided."
        job.cost_saved = 0.08
        db.commit()
        log_event(db, merchant_id, "Hash diff result", "NO_CHANGE")
        return job

    distance = semantic_distance(baseline.website_text if baseline else "", latest.text)
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
        job.tier_reached = 3
        job.status = "COMPLETED"
        job.result_summary = f"Benign semantic drift ({distance}). Baseline can be updated."
        job.cost_saved = 0.05
        log_event(db, merchant_id, "Vector diff result", job.result_summary)
    elif distance < 0.25:
        job.tier_reached = 3
        job.status = "WATCHLIST"
        job.result_summary = f"Suspicious but moderate semantic drift ({distance}). Watchlist signal created."
        db.add(RiskSignal(merchant_id=merchant_id, level="medium", source="vector_diff", reason_code="MODERATE_DRIFT", description=job.result_summary))
    else:
        report = generate_mock_report(merchant.business_name, trigger_reason, latest.text)
        job.tier_reached = 4
        job.status = "AI_REVIEW"
        job.result_summary = f"Tier 4 AI report generated. Recommendation: {report.decision_recommendation}."
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

    db.commit()
    db.refresh(job)
    return job
