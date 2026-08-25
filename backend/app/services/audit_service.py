from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_event(db: Session, merchant_id: int, event: str, details: str = "") -> None:
    db.add(AuditLog(merchant_id=merchant_id, event=event, details=details))
    db.commit()
