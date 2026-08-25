from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AdSnapshot(Base):
    __tablename__ = "ad_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    headline: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    landing_page_url: Mapped[str] = mapped_column(String(255))
    claimed_price: Mapped[float] = mapped_column(Float)
    claimed_refund: Mapped[str] = mapped_column(String(120))
    flags: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
