from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.human_review_case import HumanReviewCase
from app.models.merchant import Merchant
from app.models.risk_signal import RiskSignal
from app.schemas.review_schema import ReviewAction
from app.services.audit_service import log_event

router = APIRouter()


def serialize_case(db: Session, case: HumanReviewCase):
    merchant = db.get(Merchant, case.merchant_id)
    flags = db.query(RiskSignal).filter(RiskSignal.merchant_id == case.merchant_id).order_by(RiskSignal.id.desc()).all()
    return {
        "id": case.id,
        "merchant_id": case.merchant_id,
        "merchant_name": merchant.legal_business_name if merchant else "Unknown",
        "business_type": merchant.business_type if merchant else "",
        "category": merchant.category if merchant else "",
        "status": case.status,
        "suggested_action": case.suggested_action,
        "memo": case.memo,
        "evidence_links": case.evidence_links,
        "risk_flags": [flag.reason_code for flag in flags],
    }


@router.get("")
def list_reviews(db: Session = Depends(get_db)):
    cases = db.query(HumanReviewCase).order_by(HumanReviewCase.id.desc()).all()
    return [serialize_case(db, case) for case in cases]


@router.post("/{case_id}/action")
def action(case_id: int, payload: ReviewAction, db: Session = Depends(get_db)):
    case = db.get(HumanReviewCase, case_id)
    if not case:
        raise HTTPException(404, "Review case not found")
    case.status = payload.action.upper()
    log_event(db, case.merchant_id, "Human reviewer action", f"{payload.action}: {payload.note}")
    db.commit()
    return serialize_case(db, case)
