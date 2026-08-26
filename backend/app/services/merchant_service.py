import time
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
from app.services.gstin_service import (
    cross_validate_pan_gstin,
    get_gstin_state,
    get_pan_holder_type,
    validate_cin,
    validate_gstin,
    validate_ifsc,
    validate_pan,
)
from app.services.hash_diff_service import sha256_text
from app.services.payment_provider_service import activate_payment_provider
from app.services.risk_scoring_service import decision_for, score_merchant, validate_merchant_fields
from app.services.website_intel_service import crawl_merchant_site
from app.workers.scheduler import schedule_initial_rechecks


def _step(name: str, status: str, detail: str, duration_ms: int = 0, category: str = "general") -> dict:
    return {
        "name": name,
        "status": status,
        "detail": detail,
        "duration_ms": duration_ms,
        "category": category,
    }


def create_merchant(db: Session, payload: MerchantCreate) -> tuple[Merchant, list[str], list[str], str, list[dict]]:
    steps: list[dict] = []

    # ── STEP 1: Entity Registration ──
    t0 = time.time()
    merchant_data = payload.model_dump(exclude={"documents"}, mode="json")
    merchant_data["documents"] = ",".join(payload.documents) if payload.documents else ""
    merchant = Merchant(**merchant_data)
    db.add(merchant)
    db.commit()
    db.refresh(merchant)
    log_event(db, merchant.id, "Merchant registered", "Day-0 verification queued")
    ms = int((time.time() - t0) * 1000)
    steps.append(_step(
        "Entity Registration",
        "passed",
        f"Merchant ID #{merchant.id} created · Business type: {payload.business_type.replace('_', ' ').title()} · Legal name: {payload.legal_business_name}",
        ms,
        "registration",
    ))

    # ── STEP 2: Document Intake ──
    t0 = time.time()
    for filename in payload.documents:
        db.add(MerchantDocument(merchant_id=merchant.id, document_type="kyb", filename=filename))
    db.commit()
    ms = int((time.time() - t0) * 1000)
    steps.append(_step(
        "Document Intake",
        "passed" if payload.documents else "warning",
        f"{len(payload.documents)} document references received: {', '.join(payload.documents[:5]) or 'None'}",
        ms,
        "documents",
    ))

    # ── STEP 3: PAN Verification ──
    t0 = time.time()
    pan_valid, pan_issues = validate_pan(payload.pan)
    holder_type = get_pan_holder_type(payload.pan) if pan_valid else "Unknown"
    ms = int((time.time() - t0) * 1000) + 120  # Simulated API latency
    steps.append(_step(
        "PAN Verification",
        "passed" if pan_valid else "failed",
        f"PAN {payload.pan} — Holder type: {holder_type}" if pan_valid else "; ".join(pan_issues),
        ms,
        "kyc",
    ))

    # ── STEP 4: GSTIN Verification ──
    t0 = time.time()
    gst_valid, gst_issues = validate_gstin(payload.gst)
    state_name = get_gstin_state(payload.gst) if gst_valid else "Unknown"
    ms = int((time.time() - t0) * 1000) + 150
    steps.append(_step(
        "GSTIN Verification",
        "passed" if gst_valid else "failed",
        f"GSTIN {payload.gst} — State: {state_name} · Check digit valid" if gst_valid else "; ".join(gst_issues),
        ms,
        "kyc",
    ))

    # ── STEP 5: PAN-GSTIN Cross-Match ──
    t0 = time.time()
    if pan_valid and gst_valid:
        cross_valid, cross_issues = cross_validate_pan_gstin(payload.pan, payload.gst)
        ms = int((time.time() - t0) * 1000) + 80
        steps.append(_step(
            "PAN-GSTIN Cross-Validation",
            "passed" if cross_valid else "failed",
            f"PAN '{payload.pan}' matches GSTIN characters 3-12 '{payload.gst[2:12]}'" if cross_valid else "; ".join(cross_issues),
            ms,
            "kyc",
        ))
    else:
        steps.append(_step(
            "PAN-GSTIN Cross-Validation",
            "warning",
            "Skipped — PAN or GSTIN format invalid",
            10,
            "kyc",
        ))

    # ── STEP 6: CIN Verification (conditional) ──
    if payload.business_type in ("private_limited", "public_limited", "llp"):
        t0 = time.time()
        cin_valid, cin_issues = validate_cin(payload.cin)
        ms = int((time.time() - t0) * 1000) + 100
        steps.append(_step(
            "CIN Verification",
            "passed" if cin_valid else ("failed" if cin_issues else "warning"),
            f"CIN {payload.cin} format valid" if cin_valid and payload.cin else ("; ".join(cin_issues) if cin_issues else f"CIN not provided for {payload.business_type}"),
            ms,
            "kyc",
        ))

    # ── STEP 7: Stakeholder KYC ──
    t0 = time.time()
    if payload.stakeholder_pan:
        sp_valid, sp_issues = validate_pan(payload.stakeholder_pan)
        sp_type = get_pan_holder_type(payload.stakeholder_pan) if sp_valid else "Unknown"
        ms = int((time.time() - t0) * 1000) + 130
        individual_check = payload.stakeholder_pan[3].upper() == "P" if sp_valid else False
        steps.append(_step(
            "Stakeholder KYC",
            "passed" if sp_valid and individual_check else "failed",
            f"Stakeholder: {payload.stakeholder_name} · PAN type: {sp_type} · Designation: {payload.stakeholder_designation} · Ownership: {payload.stakeholder_ownership_pct}%"
            if sp_valid else "; ".join(sp_issues),
            ms,
            "kyc",
        ))
    else:
        steps.append(_step(
            "Stakeholder KYC",
            "warning",
            "No stakeholder PAN provided — recommended for companies and LLPs",
            10,
            "kyc",
        ))

    # ── STEP 8: Bank Account Verification ──
    t0 = time.time()
    ifsc_valid, ifsc_issues, bank_name = validate_ifsc(payload.ifsc)
    ms = int((time.time() - t0) * 1000) + 200
    if ifsc_valid:
        merchant.bank_name = bank_name
    steps.append(_step(
        "Bank Account Verification",
        "passed" if ifsc_valid else "failed",
        f"IFSC {payload.ifsc} → {bank_name} · Account: {'*' * (len(payload.bank_account) - 4) + payload.bank_account[-4:]}"
        if ifsc_valid else "; ".join(ifsc_issues),
        ms,
        "banking",
    ))

    # ── STEP 9: Bank Reuse Detection ──
    t0 = time.time()
    reused = db.query(Merchant).filter(Merchant.bank_account == payload.bank_account).count() - 1
    ms = int((time.time() - t0) * 1000) + 50
    steps.append(_step(
        "Bank Account Reuse Check",
        "warning" if reused else "passed",
        f"{reused} other merchant(s) share this bank account — potential shell network" if reused else "No duplicate bank accounts found across merchant base",
        ms,
        "banking",
    ))

    # ── STEP 10: Policy URL Differentiation ──
    t0 = time.time()
    policy_urls = [
        str(value).rstrip("/").lower()
        for value in [payload.refund_policy_url, payload.shipping_policy_url, payload.privacy_policy_url, payload.terms_url]
        if value
    ]
    duplicate_policies = len(policy_urls) == 4 and len(set(policy_urls)) == 1
    ms = int((time.time() - t0) * 1000) + 30
    steps.append(_step(
        "Policy URL Differentiation",
        "warning" if duplicate_policies else "passed",
        "All 4 policy links point to the same URL — potential compliance issue" if duplicate_policies else f"{len(policy_urls)} distinct policy URLs provided",
        ms,
        "compliance",
    ))

    # ── STEP 11: Website Crawl & Compliance Audit ──
    t0 = time.time()
    intel = crawl_merchant_site(
        str(payload.website_url),
        [payload.refund_policy_url, payload.shipping_policy_url, payload.privacy_policy_url, payload.terms_url],
    )
    ms = int((time.time() - t0) * 1000)
    steps.append(_step(
        "Website Availability",
        "passed" if intel.available else "failed",
        f"HTTP {intel.status_code} · Crawled {len(intel.fetched_urls)} pages · {'JavaScript SPA detected' if intel.is_spa else 'Server-rendered'}",
        ms,
        "website",
    ))
    for finding in intel.findings:
        steps.append(_step(finding["step"], finding["status"], finding["detail"], 0, "website"))

    # ── STEP 12: Content Extraction ──
    steps.append(_step(
        "Content Extraction",
        "passed" if intel.text else "warning",
        f"Extracted {len(intel.text):,} characters from {len(intel.fetched_urls)} URLs · Products: {intel.product_summary[:100]}",
        50,
        "website",
    ))

    # ── STEP 13: Policy Pages Audit ──
    steps.append(_step(
        "Policy Pages Audit",
        "passed" if "No policy pages" not in intel.policy_text else "warning",
        intel.policy_text[:200],
        40,
        "compliance",
    ))

    # ── STEP 14: Support Info Extraction ──
    steps.append(_step(
        "Support Information Audit",
        "passed" if "No support" not in intel.support_summary else "warning",
        intel.support_summary,
        30,
        "compliance",
    ))

    # ── STEP 15: Prohibited Content Scan ──
    t0 = time.time()
    from app.core.constants import PROHIBITED_KEYWORDS
    found_keywords = [kw for kw in PROHIBITED_KEYWORDS if kw in intel.text.lower()]
    ms = int((time.time() - t0) * 1000) + 60
    steps.append(_step(
        "Prohibited Content Scan",
        "failed" if found_keywords else "passed",
        f"FLAGGED: {', '.join(found_keywords)}" if found_keywords else "No prohibited keywords detected in crawled content",
        ms,
        "risk",
    ))

    # ── STEP 16: Trust Scoring ──
    t0 = time.time()
    invalid_kyb, invalid_financial = validate_merchant_fields(payload)
    score, reasons, checklist = score_merchant(payload, intel.text, reused)
    if not intel.available:
        score = min(score, 62)
        reasons.append("SERVICE_UNREACHABLE")
        checklist.append("Make the website reachable to the audit crawler")
    status, risk = decision_for(score)
    ms = int((time.time() - t0) * 1000) + 40
    steps.append(_step(
        "Trust Score Calculation",
        "passed" if score >= 85 else "warning" if score >= 60 else "failed",
        f"Score: {score}/100 · Risk: {risk.upper()} · Decision: {status.replace('_', ' ').title()} · {len(reasons)} signal(s)",
        ms,
        "decision",
    ))

    # ── Apply Decision ──
    merchant.trust_score = score
    merchant.status = status
    merchant.risk_level = risk
    if status == "APPROVED":
        activation = activate_payment_provider(merchant.id)
        merchant.api_key = activation.reference
        steps.append(_step(
            "Payment Gateway Activation",
            "passed" if activation.activated else "info",
            activation.detail,
            180,
            "activation",
        ))
    if status == "PENDING_REMEDIATION":
        merchant.remediation_deadline = (datetime.utcnow() + timedelta(hours=48)).isoformat()
    db.commit()

    # ── Store Snapshot ──
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
    db.add(Verification(
        merchant_id=merchant.id,
        decision=status,
        checklist="|".join(checklist),
        reason_codes="|".join(reasons),
    ))

    # ── AI Report (if needed) ──
    memo = "Rule-based checks completed. No LLM call required."
    if status in {"MANUAL_REVIEW", "REJECTED"}:
        t0 = time.time()
        report = generate_risk_report(
            payload.legal_business_name, "Day-0 verification", intel.text, str(payload.website_url),
        )
        ms = int((time.time() - t0) * 1000)
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
        db.add(HumanReviewCase(
            merchant_id=merchant.id,
            suggested_action=report.decision_recommendation,
            memo=report.underwriter_memo,
        ))
        steps.append(_step(
            "AI Risk Investigation",
            "flagged" if report.risk_score > 60 else "passed",
            f"Groq/LLM analysis complete · Risk score: {report.risk_score} · Recommendation: {report.decision_recommendation}",
            ms,
            "ai",
        ))

    for reason in reasons:
        db.add(RiskSignal(
            merchant_id=merchant.id,
            level=risk,
            source="day0",
            reason_code=reason,
            description=f"Day-0 signal: {reason}",
        ))
    db.commit()
    if status == "APPROVED":
        schedule_initial_rechecks(db, merchant)
    log_event(db, merchant.id, "Decision made", f"{status} with score {score}")
    return merchant, checklist, reasons, memo, steps
