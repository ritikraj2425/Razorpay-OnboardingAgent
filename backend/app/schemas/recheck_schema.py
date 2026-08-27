from pydantic import BaseModel, Field


class RecheckRequest(BaseModel):
    trigger_reason: str = Field(default="manual_recheck", min_length=2)


class EventTriggerRequest(BaseModel):
    event_type: str = Field(description="TRANSACTION_SPIKE | COMPLAINT_SPIKE | CONTENT_CHANGE | MANUAL")
    details: str = Field(default="", description="Human-readable context for the trigger")
