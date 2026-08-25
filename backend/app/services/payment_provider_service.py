from dataclasses import dataclass

from app.core.config import settings


@dataclass
class ProviderActivation:
    activated: bool
    reference: str
    detail: str


def activate_payment_provider(merchant_id: int) -> ProviderActivation:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        return ProviderActivation(
            activated=False,
            reference="",
            detail="Razorpay credentials are not configured. Merchant is approved internally; provider activation is pending.",
        )
    return ProviderActivation(
        activated=False,
        reference=f"merchant:{merchant_id}",
        detail="Razorpay credentials are configured. Connect the partner/account onboarding endpoint for live account activation.",
    )


def lower_payout_limit(current: float, risk_level: str) -> float:
    if risk_level == "critical":
        return min(current, 10000)
    if risk_level == "high":
        return min(current, 25000)
    return current
