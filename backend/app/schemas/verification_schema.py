from pydantic import BaseModel

from app.schemas.merchant_schema import MerchantOut


class VerificationResult(BaseModel):
    merchant: MerchantOut
    decision: str
    score: int
    risk_level: str
    checklist: list[str]
    reason_codes: list[str]
    underwriter_memo: str
