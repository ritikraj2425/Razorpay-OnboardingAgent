from pydantic import BaseModel, EmailStr, Field, HttpUrl


class MerchantCreate(BaseModel):
    business_name: str = Field(min_length=2)
    owner_name: str = Field(min_length=2)
    category: str
    pan: str
    gst: str
    bank_account: str
    ifsc: str
    website_url: HttpUrl
    social_links: str = ""
    expected_monthly_volume: float
    expected_average_order_value: float
    refund_policy_url: str = ""
    shipping_policy_url: str = ""
    privacy_policy_url: str = ""
    terms_url: str = ""
    support_email: EmailStr
    support_phone: str
    documents: list[str] = []


class MerchantOut(BaseModel):
    id: int
    business_name: str
    owner_name: str
    category: str
    website_url: str
    status: str
    risk_level: str
    trust_score: int
    support_email: str
    support_phone: str
    remediation_deadline: str
    payout_limit: float

    class Config:
        from_attributes = True
