from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.ai_report import AIReport
from app.models.human_review_case import HumanReviewCase
from app.models.merchant import Merchant
from app.models.merchant_document import MerchantDocument
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.risk_signal import RiskSignal
from app.models.verification import Verification
from app.schemas.merchant_schema import MerchantCreate
from app.services.ai_investigation_service import generate_mock_report
from app.services.audit_service import log_event
from app.services.hash_diff_service import sha256_text
from app.services.mock_razorpay_service import create_sandbox_keys
from app.services.risk_scoring_service import decision_for, score_merchant
from app.services.website_intel_service import mock_site_for


def create_merchant(db: Session, payload: MerchantCreate) -> tuple[Merchant, list[str], list[str], str]:
    merchant = Merchant(**payload.model_dump(exclude={"documents"}, mode="json"))
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    log_event(db, merchant.id, "Merchant registered", "Day-0 verification queued")

    for filename in payload.documents:
        db.add(MerchantDocument(merchant_id=merchant.id, document_type="kyb", filename=filename))
    db.commit()

    reused = db.query(Merchant).filter(Merchant.bank_account == payload.bank_account).count() - 1
    intel = mock_site_for(payload.business_name, payload.category)
    score, reasons, checklist = score_merchant(payload, intel.text, reused)
    status, risk = decision_for(score)

    merchant.trust_score = score
    merchant.status = status
    merchant.risk_level = risk
    if status == "APPROVED":
        merchant.api_key = create_sandbox_keys(merchant.id)
    if status == "PENDING_REMEDIATION":
        merchant.remediation_deadline = (datetime.utcnow() + timedelta(hours=48)).isoformat()
    db.commit()

    db.add(
        MerchantSnapshot(
            merchant_id=merchant.id,
            kind="baseline",
            html_hash=sha256_text(intel.html),
            website_text=intel.text,
            policy_text=intel.policy_text,
            product_summary=intel.product_summary,
            price_summary=intel.price_summary,
            support_summary=intel.support_summary,
        )
    )
    db.add(Verification(merchant_id=merchant.id, decision=status, checklist="|".join(checklist), reason_codes="|".join(reasons)))

    memo = "Rule-based checks completed. No LLM call required."
    if status in {"MANUAL_REVIEW", "REJECTED"}:
        report = generate_mock_report(payload.business_name, "Day-0 verification", intel.text)
        memo = report.underwriter_memo
        db.add(
            AIReport(
                merchant_id=merchant.id,
                risk_score=report.risk_score,
                risk_level=report.risk_level,
                decision_recommendation=report.decision_recommendation,
                reason_codes="|".join(report.reason_codes),
                evidence=report.model_dump_json(),
                underwriter_memo=report.underwriter_memo,
                merchant_message=report.merchant_message,
            )
        )
        db.add(HumanReviewCase(merchant_id=merchant.id, suggested_action=report.decision_recommendation, memo=report.underwriter_memo))

    for reason in reasons:
        db.add(RiskSignal(merchant_id=merchant.id, level=risk, source="day0", reason_code=reason, description=f"Day-0 signal: {reason}"))
    db.commit()
    log_event(db, merchant.id, "Decision made", f"{status} with score {score}")
    return merchant, checklist, reasons, memo
