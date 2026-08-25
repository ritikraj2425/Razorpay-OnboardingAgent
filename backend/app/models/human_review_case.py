from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class HumanReviewCase(Base):
    __tablename__ = "human_review_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    status: Mapped[str] = mapped_column(String(40), default="OPEN")
    suggested_action: Mapped[str] = mapped_column(String(80))
    memo: Mapped[str] = mapped_column(Text)
    evidence_links: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
