from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional


BUSINESS_TYPES = [
    "proprietorship", "partnership", "private_limited", "public_limited",
    "llp", "ngo", "trust", "society", "huf", "not_yet_registered",
]

CATEGORIES = [
    "ecommerce", "education", "healthcare", "financial_services", "food",
    "it_and_software", "gaming", "social", "media_and_entertainment",
    "utilities", "government", "logistics", "tours_and_travel",
    "transport", "housing", "grocery", "cabs", "not_for_profit", "others",
]


class MerchantCreate(BaseModel):
    # ── Business Identity ──
    business_type: str = Field(min_length=2, description="Legal structure: proprietorship, partnership, private_limited, etc.")
    legal_business_name: str = Field(min_length=2, max_length=200, description="Registered name as per PAN/GST")
    customer_facing_business_name: str = Field(default="", description="Brand name shown to customers")
    contact_name: str = Field(min_length=2, max_length=120, description="Authorized signatory / primary contact")
    category: str = Field(description="Business category: ecommerce, education, healthcare, etc.")
    subcategory: str = Field(default="", description="Business sub-category")
    mcc_code: str = Field(default="", description="Merchant Category Code")
    description: str = Field(default="", description="Brief description of products/services")

    # ── KYC / Legal Info ──
    pan: str = Field(description="PAN of the business entity")
    gst: str = Field(description="GSTIN of the business")
    cin: str = Field(default="", description="Company Identification Number (for companies/LLPs)")

    # ── Stakeholder ──
    stakeholder_name: str = Field(default="", description="Name of authorized signatory as per PAN")
    stakeholder_pan: str = Field(default="", description="PAN of the authorized signatory")
    stakeholder_designation: str = Field(default="director", description="director, executive, etc.")
    stakeholder_ownership_pct: float = Field(default=100.0, ge=0, le=100)

    # ── Addresses ──
    registered_address: str = Field(default="", description="Full registered business address")
    registered_city: str = Field(default="")
    registered_state: str = Field(default="")
    registered_pincode: str = Field(default="")
    operational_address: str = Field(default="")

    # ── Banking ──
    bank_account: str = Field(description="Bank account number")
    ifsc: str = Field(description="IFSC code of the bank branch")
    bank_name: str = Field(default="", description="Name of the bank")
    beneficiary_name: str = Field(default="", description="Name on the bank account")

    # ── Website & Compliance ──
    website_url: HttpUrl
    social_links: str = ""
    refund_policy_url: str = ""
    shipping_policy_url: str = ""
    privacy_policy_url: str = ""
    terms_url: str = ""
    support_email: EmailStr
    support_phone: str = Field(min_length=8, max_length=15)

    # ── Financial Profile ──
    expected_monthly_volume: float = Field(ge=0)
    expected_average_order_value: float = Field(ge=0)

    # ── Documents ──
    documents: list[str] = []


class MerchantOut(BaseModel):
    id: int
    business_type: str
    legal_business_name: str
    customer_facing_business_name: str
    contact_name: str
    category: str
    subcategory: str
    website_url: str
    status: str
    risk_level: str
    trust_score: int
    support_email: str
    support_phone: str
    remediation_deadline: str
    payout_limit: float
    pan: str
    gst: str
    bank_account: str
    ifsc: str
    registered_state: str
    registered_city: str
    stakeholder_name: str

    class Config:
        from_attributes = True
