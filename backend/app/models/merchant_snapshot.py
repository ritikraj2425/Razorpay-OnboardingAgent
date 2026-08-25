from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MerchantSnapshot(Base):
    __tablename__ = "merchant_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    kind: Mapped[str] = mapped_column(String(20), default="baseline")
    html_hash: Mapped[str] = mapped_column(String(64))
    website_text: Mapped[str] = mapped_column(Text)
    policy_text: Mapped[str] = mapped_column(Text)
    product_summary: Mapped[str] = mapped_column(Text)
    price_summary: Mapped[str] = mapped_column(Text)
    support_summary: Mapped[str] = mapped_column(Text)
    semantic_drift_score: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
