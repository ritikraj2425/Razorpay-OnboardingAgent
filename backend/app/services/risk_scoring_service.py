import re

from app.core.constants import PROHIBITED_KEYWORDS
from app.core.enums import MerchantStatus, RiskLevel
from app.services.gstin_service import (
    cross_validate_pan_gstin,
    get_pan_holder_type,
    validate_cin,
    validate_gstin,
    validate_ifsc,
    validate_pan,
)


# Business type → PAN holder type coherence
_BUSINESS_PAN_MAP = {
    "proprietorship": {"P"},  # Individual PAN
    "partnership": {"F"},  # Firm
    "private_limited": {"C"},  # Company
    "public_limited": {"C"},
    "llp": {"F"},
    "ngo": {"T", "A"},  # Trust or AOP
    "trust": {"T"},
    "society": {"A"},
    "huf": {"H"},
}

# High-risk MCC codes
_HIGH_RISK_MCC = {"5967", "5993", "7995", "5912", "5122", "5944", "4816", "7273"}

# Suspicious category combinations
_SUSPICIOUS_COMBOS = {
    ("ngo", "financial_services"), ("ngo", "gaming"),
    ("trust", "ecommerce"), ("trust", "gaming"),
    ("society", "financial_services"),
}


def validate_merchant_fields(payload) -> tuple[list[str], list[str]]:
    """Validate KYB and financial fields. Returns (kyb_issues, financial_issues)."""
    invalid_kyb: list[str] = []
    invalid_financial: list[str] = []

    # ── PAN validation ──
    pan_valid, pan_issues = validate_pan(payload.pan)
    if not pan_valid:
        invalid_kyb.extend(pan_issues)

    # ── GSTIN validation ──
    gst_valid, gst_issues = validate_gstin(payload.gst)
    if not gst_valid:
        invalid_kyb.extend(gst_issues)

    # ── PAN-GSTIN cross-match ──
    if pan_valid and gst_valid:
        cross_valid, cross_issues = cross_validate_pan_gstin(payload.pan, payload.gst)
        if not cross_valid:
            invalid_kyb.extend(cross_issues)

    # ── CIN validation (for companies) ──
    if payload.business_type in ("private_limited", "public_limited", "llp"):
        cin_valid, cin_issues = validate_cin(getattr(payload, "cin", ""))
        if not cin_valid:
            invalid_kyb.extend(cin_issues)
        elif not getattr(payload, "cin", ""):
            invalid_kyb.append(f"CIN is required for {payload.business_type} entities")

    # ── Business type vs PAN holder type coherence ──
    if pan_valid:
        holder_type = get_pan_holder_type(payload.pan)
        expected = _BUSINESS_PAN_MAP.get(payload.business_type, set())
        if expected and payload.pan[3].upper() not in expected:
            invalid_kyb.append(
                f"PAN holder type '{holder_type}' does not match business type "
                f"'{payload.business_type}' — expected: {', '.join(expected)}"
            )

    # ── Stakeholder PAN validation ──
    stakeholder_pan = getattr(payload, "stakeholder_pan", "")
    if stakeholder_pan:
        sp_valid, sp_issues = validate_pan(stakeholder_pan)
        if not sp_valid:
            invalid_kyb.extend([f"Stakeholder {i}" for i in sp_issues])
        elif stakeholder_pan[3].upper() != "P":
            invalid_kyb.append("Stakeholder PAN must be of type 'P' (Individual)")

    # ── IFSC validation ──
    ifsc_valid, ifsc_issues, _ = validate_ifsc(payload.ifsc)
    if not ifsc_valid:
        invalid_financial.extend(ifsc_issues)

    # ── Bank account validation ──
    if not re.fullmatch(r"[0-9]{9,18}", payload.bank_account.strip()):
        invalid_financial.append("Bank account must contain 9 to 18 digits")

    return invalid_kyb, invalid_financial


def score_merchant(payload, website_text: str, reused_bank_count: int = 0) -> tuple[int, list[str], list[str]]:
    """Score a merchant and return (score, reason_codes, checklist)."""
    score = 100
    reasons: list[str] = []
    checklist: list[str] = []
    text = website_text.lower()
    invalid_kyb, invalid_financial = validate_merchant_fields(payload)

    # ── KYB Validation ──
    if invalid_kyb:
        score -= min(35, 8 * len(invalid_kyb))
        reasons.append("INVALID_KYB_DATA")
        checklist.append("Fix KYB issues: " + "; ".join(invalid_kyb[:3]))

    # ── Financial Validation ──
    if invalid_financial:
        score -= 25
        reasons.append("INVALID_BANKING_DATA")
        checklist.append("Fix banking details: " + "; ".join(invalid_financial))

    # ── PAN-GSTIN Cross-Match ──
    pan_valid, _ = validate_pan(payload.pan)
    gst_valid, _ = validate_gstin(payload.gst)
    if pan_valid and gst_valid:
        cross_valid, _ = cross_validate_pan_gstin(payload.pan, payload.gst)
        if not cross_valid:
            score -= 20
            reasons.append("PAN_GSTIN_MISMATCH")
            checklist.append("PAN does not match the PAN embedded in GSTIN — verify identity documents")

    # ── Missing Policies ──
    missing_policies = [
        label
        for label, value in [
            ("refund policy", payload.refund_policy_url),
            ("shipping policy", payload.shipping_policy_url),
            ("privacy policy", payload.privacy_policy_url),
            ("terms", payload.terms_url),
        ]
        if not value
    ]
    if missing_policies:
        score -= 8 * len(missing_policies)
        checklist.extend(f"Add {item} URL" for item in missing_policies)
        reasons.append("MISSING_POLICY")

    # ── Duplicate Policy URLs ──
    policy_urls = [
        str(value).rstrip("/").lower()
        for value in [
            payload.refund_policy_url, payload.shipping_policy_url,
            payload.privacy_policy_url, payload.terms_url,
        ]
        if value
    ]
    if len(policy_urls) == 4 and len(set(policy_urls)) == 1:
        score -= 12
        reasons.append("DUPLICATE_POLICY_URLS")
        checklist.append("Provide distinct URLs for each policy page")

    # ── Prohibited / High-Risk Content ──
    if any(keyword in text for keyword in PROHIBITED_KEYWORDS):
        score -= 38
        reasons.append("PROHIBITED_OR_HIGH_RISK_CATEGORY")
        checklist.append("Clarify category and remove prohibited or misleading claims")

    # ── Support ──
    if not payload.support_phone or len(payload.support_phone) < 8:
        score -= 5
        reasons.append("WEAK_SUPPORT")
        checklist.append("Provide a reachable support phone")

    # ── Financial Outliers ──
    if payload.expected_average_order_value > 50000:
        score -= 8
        reasons.append("AOV_OUTLIER")

    # ── Bank Reuse Network ──
    if reused_bank_count >= 2:
        score -= 18
        reasons.append("BANK_REUSE_NETWORK")

    # ── Business Type vs Category Coherence ──
    bt = getattr(payload, "business_type", "").lower()
    cat = getattr(payload, "category", "").lower()
    if (bt, cat) in _SUSPICIOUS_COMBOS:
        score -= 15
        reasons.append("ENTITY_CATEGORY_MISMATCH")
        checklist.append(f"Business type '{bt}' operating in '{cat}' is flagged for review")

    # ── MCC Risk ──
    mcc = getattr(payload, "mcc_code", "")
    if mcc in _HIGH_RISK_MCC:
        score -= 10
        reasons.append("HIGH_RISK_MCC")

    # ── Missing Documents for Regulated Categories ──
    documents = getattr(payload, "documents", [])
    regulated = {"healthcare", "financial_services", "gaming", "food"}
    if cat in regulated and not documents:
        score -= 18
        reasons.append("MISSING_LICENSE_DOCUMENT")
        checklist.append("Upload licensing/registration documentation for regulated category")

    # ── Address Completeness ──
    if not getattr(payload, "registered_pincode", ""):
        score -= 3
        reasons.append("INCOMPLETE_ADDRESS")
        checklist.append("Provide complete registered address with pincode")

    return max(score, 0), sorted(set(reasons)), checklist


def decision_for(score: int) -> tuple[str, str]:
    if score >= 85:
        return MerchantStatus.APPROVED.value, RiskLevel.LOW.value
    if score >= 60:
        return MerchantStatus.PENDING_REMEDIATION.value, RiskLevel.MEDIUM.value
    if score >= 40:
        return MerchantStatus.MANUAL_REVIEW.value, RiskLevel.HIGH.value
    return MerchantStatus.REJECTED.value, RiskLevel.CRITICAL.value
