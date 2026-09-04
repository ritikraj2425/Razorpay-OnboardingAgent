from datetime import datetime

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # ── Business Identity (Razorpay Account fields) ──
    business_type: Mapped[str] = mapped_column(String(40), default="proprietorship")
    legal_business_name: Mapped[str] = mapped_column(String(200), index=True)
    customer_facing_business_name: Mapped[str] = mapped_column(String(200), default="")
    contact_name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(80))
    subcategory: Mapped[str] = mapped_column(String(80), default="")
    mcc_code: Mapped[str] = mapped_column(String(10), default="")
    description: Mapped[str] = mapped_column(Text, default="")

    # ── KYC / Legal Info ──
    pan: Mapped[str] = mapped_column(String(16))
    gst: Mapped[str] = mapped_column(String(24))
    cin: Mapped[str] = mapped_column(String(24), default="")

    # ── Stakeholder / Authorized Signatory ──
    stakeholder_name: Mapped[str] = mapped_column(String(120), default="")
    stakeholder_pan: Mapped[str] = mapped_column(String(16), default="")
    stakeholder_designation: Mapped[str] = mapped_column(String(40), default="director")
    stakeholder_ownership_pct: Mapped[float] = mapped_column(Float, default=100.0)

    # ── Addresses ──
    registered_address: Mapped[str] = mapped_column(Text, default="")
    registered_city: Mapped[str] = mapped_column(String(80), default="")
    registered_state: Mapped[str] = mapped_column(String(60), default="")
    registered_pincode: Mapped[str] = mapped_column(String(10), default="")
    operational_address: Mapped[str] = mapped_column(Text, default="")

    # ── Banking ──
    bank_account: Mapped[str] = mapped_column(String(32))
    ifsc: Mapped[str] = mapped_column(String(16))
    bank_name: Mapped[str] = mapped_column(String(120), default="")
    bank_branch: Mapped[str] = mapped_column(String(120), default="")
    beneficiary_name: Mapped[str] = mapped_column(String(160), default="")

    # ── Website & Compliance ──
    website_url: Mapped[str] = mapped_column(String(255))
    social_links: Mapped[str] = mapped_column(Text, default="")
    refund_policy_url: Mapped[str] = mapped_column(String(255), default="")
    shipping_policy_url: Mapped[str] = mapped_column(String(255), default="")
    privacy_policy_url: Mapped[str] = mapped_column(String(255), default="")
    terms_url: Mapped[str] = mapped_column(String(255), default="")
    support_email: Mapped[str] = mapped_column(String(160))
    support_phone: Mapped[str] = mapped_column(String(40))

    # ── Financial Profile ──
    expected_monthly_volume: Mapped[float] = mapped_column(Float, default=0)
    expected_average_order_value: Mapped[float] = mapped_column(Float, default=0)

    # ── Documents (comma-separated filenames) ──
    documents: Mapped[str] = mapped_column(Text, default="")

    # ── Platform State ──
    status: Mapped[str] = mapped_column(String(40), default="PENDING_REMEDIATION")
    risk_level: Mapped[str] = mapped_column(String(20), default="medium")
    trust_score: Mapped[int] = mapped_column(Integer, default=0)
    remediation_deadline: Mapped[str] = mapped_column(String(40), default="")
    api_key: Mapped[str] = mapped_column(String(80), default="")
    payout_limit: Mapped[float] = mapped_column(Float, default=100000)
    onboarding_steps: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
