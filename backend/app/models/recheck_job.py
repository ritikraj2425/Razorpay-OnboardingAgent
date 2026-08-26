from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class RecheckJob(Base):
    __tablename__ = "recheck_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    trigger_reason: Mapped[str] = mapped_column(String(120))
    tier_reached: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(40), default="QUEUED")
    result_summary: Mapped[str] = mapped_column(Text, default="")
    cost_saved: Mapped[float] = mapped_column(Float, default=0)
    last_checked_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    next_check_due: Mapped[str] = mapped_column(String(40), default="")
    tier_details: Mapped[str] = mapped_column(Text, default="[]")
