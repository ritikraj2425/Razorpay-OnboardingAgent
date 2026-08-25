from sqlalchemy import Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TransactionSummary(Base):
    __tablename__ = "transaction_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    refund_rate: Mapped[float] = mapped_column(Float, default=0)
    chargeback_rate: Mapped[float] = mapped_column(Float, default=0)
    velocity_spike: Mapped[float] = mapped_column(Float, default=0)
    complaint_count: Mapped[int] = mapped_column(Integer, default=0)
