from typing import Optional
from app.agents.base import BaseAgent
from app.services.website_intel_service import WebsiteIntel, crawl_merchant_site


class WebsiteRiskAgent(BaseAgent):
    """
    Crawls and analyzes merchant websites for operational availability,
    SPA detection, catalog inspection, and policy presence.
    Inherits from BaseAgent (OOP: Inheritance).
    """
    def __init__(self):
        super().__init__(
            name="WebsiteRiskAgent",
            description="Crawls and extracts structured intelligence from merchant domains"
        )

    def _execute(self, url: str, policy_urls: Optional[list[Optional[str]]] = None) -> WebsiteIntel:
        return crawl_merchant_site(url, policy_urls)


_instance = WebsiteRiskAgent()

__all__ = ["WebsiteRiskAgent", "crawl_merchant_site"]
