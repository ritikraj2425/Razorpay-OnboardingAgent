from app.agents.base import BaseAgent
from app.models.ad_snapshot import AdSnapshot
from app.services.ad_verification_service import detect_ad_flags


class AdPolicyMismatchAgent(BaseAgent):
    """
    Detects bait-and-switch discrepancies between marketing ad campaigns
    and actual on-site pricing or refund policies.
    Inherits from BaseAgent (OOP: Inheritance).
    """
    def __init__(self):
        super().__init__(
            name="AdPolicyMismatchAgent",
            description="Audits advertising campaigns against website disclosures for deceptive marketing"
        )

    def _execute(self, ad: AdSnapshot, website_price_summary: str, policy_text: str) -> list[str]:
        return detect_ad_flags(ad, website_price_summary, policy_text)


_instance = AdPolicyMismatchAgent()

__all__ = ["AdPolicyMismatchAgent", "detect_ad_flags"]
