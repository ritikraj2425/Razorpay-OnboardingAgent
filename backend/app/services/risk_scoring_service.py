from app.core.constants import PROHIBITED_KEYWORDS
from app.core.enums import MerchantStatus, RiskLevel


def score_merchant(payload, website_text: str, reused_bank_count: int = 0) -> tuple[int, list[str], list[str]]:
    score = 100
    reasons: list[str] = []
    checklist: list[str] = []
    text = website_text.lower()

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

    if any(keyword in text for keyword in PROHIBITED_KEYWORDS):
        score -= 38
        reasons.append("PROHIBITED_OR_HIGH_RISK_CATEGORY")
        checklist.append("Clarify category and remove prohibited or misleading claims")

    if not payload.support_phone or len(payload.support_phone) < 8:
        score -= 5
        reasons.append("WEAK_SUPPORT")
        checklist.append("Provide a reachable support phone")

    if payload.expected_average_order_value > 50000:
        score -= 8
        reasons.append("AOV_OUTLIER")

    if reused_bank_count >= 2:
        score -= 18
        reasons.append("BANK_REUSE_NETWORK")

    if "ayurveda" in payload.business_name.lower() and not payload.documents:
        score -= 18
        reasons.append("MISSING_LICENSE_DOCUMENT")
        checklist.append("Upload supplement or licensing documentation")

    return max(score, 0), sorted(set(reasons)), checklist


def decision_for(score: int) -> tuple[str, str]:
    if score >= 85:
        return MerchantStatus.APPROVED.value, RiskLevel.LOW.value
    if score >= 60:
        return MerchantStatus.PENDING_REMEDIATION.value, RiskLevel.MEDIUM.value
    if score >= 40:
        return MerchantStatus.MANUAL_REVIEW.value, RiskLevel.HIGH.value
    return MerchantStatus.REJECTED.value, RiskLevel.CRITICAL.value
