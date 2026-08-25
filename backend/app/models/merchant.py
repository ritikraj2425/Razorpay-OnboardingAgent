from datetime import datetime

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    business_name: Mapped[str] = mapped_column(String(160), index=True)
    owner_name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(80))
    pan: Mapped[str] = mapped_column(String(16))
    gst: Mapped[str] = mapped_column(String(24))
    bank_account: Mapped[str] = mapped_column(String(32))
    ifsc: Mapped[str] = mapped_column(String(16))
    website_url: Mapped[str] = mapped_column(String(255))
    social_links: Mapped[str] = mapped_column(Text, default="")
    expected_monthly_volume: Mapped[float] = mapped_column(Float, default=0)
    expected_average_order_value: Mapped[float] = mapped_column(Float, default=0)
    refund_policy_url: Mapped[str] = mapped_column(String(255), default="")
    shipping_policy_url: Mapped[str] = mapped_column(String(255), default="")
    privacy_policy_url: Mapped[str] = mapped_column(String(255), default="")
    terms_url: Mapped[str] = mapped_column(String(255), default="")
    support_email: Mapped[str] = mapped_column(String(160))
    support_phone: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(40), default="PENDING_REMEDIATION")
    risk_level: Mapped[str] = mapped_column(String(20), default="medium")
    trust_score: Mapped[int] = mapped_column(Integer, default=0)
    remediation_deadline: Mapped[str] = mapped_column(String(40), default="")
    api_key: Mapped[str] = mapped_column(String(80), default="")
    payout_limit: Mapped[float] = mapped_column(Float, default=100000)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
