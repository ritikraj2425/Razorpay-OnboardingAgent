from app.agents.base import BaseAgent
from app.schemas.ai_schema import AIInvestigationReport
from app.services.ai_investigation_service import generate_risk_report


class UnderwriterReportAgent(BaseAgent):
    """
    Synthesizes risk signals, KYC validations, and crawled website context
    into a structured risk assessment memo.
    Inherits from BaseAgent (OOP: Inheritance).
    """
    def __init__(self):
        super().__init__(
            name="UnderwriterReportAgent",
            description="Generates AI risk investigation reports and underwriter memos"
        )

    def _execute(
        self,
        merchant_name: str,
        trigger: str,
        source_text: str,
        source_url: str = "crawl://latest",
        kyc_data: str = "",
    ) -> AIInvestigationReport:
        return generate_risk_report(
            merchant_name=merchant_name,
            trigger=trigger,
            source_text=source_text,
            source_url=source_url,
            kyc_data=kyc_data,
        )


_instance = UnderwriterReportAgent()

__all__ = ["UnderwriterReportAgent", "generate_risk_report"]
