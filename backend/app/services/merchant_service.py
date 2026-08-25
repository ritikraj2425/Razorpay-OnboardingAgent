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
from app.services.ai_investigation_service import generate_risk_report
from app.services.audit_service import log_event
from app.services.hash_diff_service import sha256_text
from app.services.payment_provider_service import activate_payment_provider
from app.services.risk_scoring_service import decision_for, score_merchant, validate_merchant_fields
from app.services.website_intel_service import crawl_merchant_site
from app.workers.scheduler import schedule_initial_rechecks


def _step(name: str, status: str, detail: str) -> dict[str, str]:
    return {"name": name, "status": status, "detail": detail}


def create_merchant(db: Session, payload: MerchantCreate) -> tuple[Merchant, list[str], list[str], str, list[dict[str, str]]]:
    steps: list[dict[str, str]] = []
    merchant = Merchant(**payload.model_dump(exclude={"documents"}, mode="json"))
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    log_event(db, merchant.id, "Merchant registered", "Day-0 verification queued")
    steps.append(_step("Merchant record", "passed", "Business and owner information stored."))

    for filename in payload.documents:
        db.add(MerchantDocument(merchant_id=merchant.id, document_type="kyb", filename=filename))
    db.commit()
    steps.append(_step("Document intake", "passed" if payload.documents else "warning", f"{len(payload.documents)} document references received."))

    reused = db.query(Merchant).filter(Merchant.bank_account == payload.bank_account).count() - 1
    steps.append(_step("Bank reuse check", "warning" if reused else "passed", f"{reused} other merchant records use this bank account."))
    invalid_kyb, invalid_financial = validate_merchant_fields(payload)
    steps.append(_step("KYB field validation", "failed" if invalid_kyb else "passed", "; ".join(invalid_kyb) if invalid_kyb else "PAN and GSTIN match expected formats; external registry verification is not configured."))
    steps.append(_step("Banking field validation", "failed" if invalid_financial else "passed", "; ".join(invalid_financial) if invalid_financial else "Bank account and IFSC match expected formats; penny-drop verification is not configured."))
    policy_urls = [str(value).rstrip("/").lower() for value in [payload.refund_policy_url, payload.shipping_policy_url, payload.privacy_policy_url, payload.terms_url] if value]
    duplicate_policies = len(policy_urls) == 4 and len(set(policy_urls)) == 1
    steps.append(_step("Policy URL differentiation", "warning" if duplicate_policies else "passed", "All policy links point to the same URL." if duplicate_policies else "Policy links are distinct or intentionally optional."))
    intel = crawl_merchant_site(
        str(payload.website_url),
        [
            payload.refund_policy_url,
            payload.shipping_policy_url,
            payload.privacy_policy_url,
            payload.terms_url,
        ],
    )
    steps.append(_step("Website availability", "passed" if intel.available else "warning", f"HTTP {intel.status_code}; fetched {len(intel.fetched_urls)} pages."))
    for finding in intel.findings:
        steps.append(_step(finding["step"], finding["status"], finding["detail"]))
    steps.append(_step("Content extraction", "passed" if intel.text else "warning", f"Extracted {len(intel.text)} characters from {len(intel.fetched_urls)} URLs."))
    steps.append(_step("Policy extraction", "passed" if "No policy pages" not in intel.policy_text else "warning", intel.policy_text[:180]))
    steps.append(_step("Support extraction", "passed" if "No support" not in intel.support_summary else "warning", intel.support_summary))
    score, reasons, checklist = score_merchant(payload, intel.text, reused)
    if not intel.available:
        score = min(score, 62)
        reasons.append("SERVICE_UNREACHABLE")
        checklist.append("Make the website reachable to SentinelPay audit crawler")
    status, risk = decision_for(score)
    steps.append(_step("Trust score", "passed" if score >= 85 else "warning" if score >= 60 else "failed", f"Calculated score {score}; decision {status}."))

    merchant.trust_score = score
    merchant.status = status
    merchant.risk_level = risk
    if status == "APPROVED":
        activation = activate_payment_provider(merchant.id)
        merchant.api_key = activation.reference
        steps.append(_step("Payment provider activation", "passed" if activation.activated else "warning", activation.detail))
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
        report = generate_risk_report(payload.business_name, "Day-0 verification", intel.text, str(payload.website_url))
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
    if status == "APPROVED":
        schedule_initial_rechecks(db, merchant)
    log_event(db, merchant.id, "Decision made", f"{status} with score {score}")
    return merchant, checklist, reasons, memo, steps
