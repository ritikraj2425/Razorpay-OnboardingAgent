from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class MerchantDocument(Base):
    __tablename__ = "merchant_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(60))
    filename: Mapped[str] = mapped_column(String(160))
    verification_status: Mapped[str] = mapped_column(String(40), default="MOCK_VERIFIED")
