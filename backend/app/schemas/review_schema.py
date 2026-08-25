from pydantic import BaseModel


class ReviewAction(BaseModel):
    action: str
    note: str = ""


class ReviewOut(BaseModel):
    id: int
    merchant_id: int
    merchant_name: str
    status: str
    suggested_action: str
    memo: str
    evidence_links: str
    risk_flags: list[str]
