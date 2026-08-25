from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    decision: Mapped[str] = mapped_column(String(40))
    checklist: Mapped[str] = mapped_column(Text, default="")
    reason_codes: Mapped[str] = mapped_column(Text, default="")
