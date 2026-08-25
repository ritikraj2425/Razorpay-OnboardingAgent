from pydantic import BaseModel


class RecheckRequest(BaseModel):
    trigger_reason: str = "Manual admin recheck requested"


class RecheckOut(BaseModel):
    id: int
    merchant_id: int
    merchant_name: str
    risk_level: str
    trigger_reason: str
    tier_reached: int
    status: str
    result_summary: str
    cost_saved: float
    last_checked_at: str
    next_check_due: str
