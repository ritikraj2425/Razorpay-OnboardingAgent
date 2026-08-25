from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.merchant import Merchant
from app.models.recheck_job import RecheckJob
from app.schemas.recheck_schema import RecheckRequest
from app.services.recheck_orchestrator import run_recheck

router = APIRouter()


def serialize_job(db: Session, job: RecheckJob):
    merchant = db.get(Merchant, job.merchant_id)
    return {
        "id": job.id,
        "merchant_id": job.merchant_id,
        "merchant_name": merchant.business_name if merchant else "Unknown",
        "risk_level": merchant.risk_level if merchant else "medium",
        "trigger_reason": job.trigger_reason,
        "tier_reached": job.tier_reached,
        "status": job.status,
        "result_summary": job.result_summary,
        "cost_saved": job.cost_saved,
        "last_checked_at": job.last_checked_at.isoformat(),
        "next_check_due": job.next_check_due,
    }


@router.get("")
def list_rechecks(db: Session = Depends(get_db)):
    jobs = db.query(RecheckJob).order_by(RecheckJob.id.desc()).all()
    return [serialize_job(db, job) for job in jobs]


@router.post("/{merchant_id}/run")
def run(merchant_id: int, payload: RecheckRequest, db: Session = Depends(get_db)):
    try:
        job = run_recheck(db, merchant_id, payload.trigger_reason)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    return serialize_job(db, job)
