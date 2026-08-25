from app.models.ad_snapshot import AdSnapshot


def detect_ad_flags(ad: AdSnapshot, website_price_summary: str, policy_text: str) -> list[str]:
    flags: list[str] = []
    if ad.claimed_price and "7999" in website_price_summary and ad.claimed_price < 1500:
        flags.append("BAIT_AND_SWITCH_PRICING")
    if "guarantee" in ad.claimed_refund.lower() and "exclude" in policy_text.lower():
        flags.append("POLICY_MISMATCH")
    if "urgent" in ad.body.lower() or "miracle" in ad.body.lower():
        flags.append("MISLEADING_AD_LANGUAGE")
    return flags
