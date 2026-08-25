from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    breakdown_json: Mapped[str] = mapped_column(String(800), default="{}")
