from typing import Literal

from pydantic import BaseModel


class Evidence(BaseModel):
    type: Literal["website", "ad", "policy", "transaction", "document"]
    url: str
    quote: str
    explanation: str


class AIInvestigationReport(BaseModel):
    risk_score: int
    risk_level: Literal["low", "medium", "high", "critical"]
    decision_recommendation: Literal[
        "approve",
        "watchlist",
        "request_info",
        "lower_payout_limit",
        "temporary_hold",
        "manual_review",
        "reject",
    ]
    reason_codes: list[str]
    evidence: list[Evidence]
    underwriter_memo: str
    merchant_message: str
