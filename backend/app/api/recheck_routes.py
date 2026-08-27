import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.merchant import Merchant
from app.models.recheck_job import RecheckJob
from app.schemas.recheck_schema import RecheckRequest, EventTriggerRequest
from app.services.recheck_orchestrator import run_recheck
from app.services.audit_service import log_event

router = APIRouter()


def serialize_job(db: Session, job: RecheckJob):
    merchant = db.get(Merchant, job.merchant_id)
    try:
        tier_details = json.loads(job.tier_details) if job.tier_details else []
    except (json.JSONDecodeError, TypeError):
        tier_details = []
    return {
        "id": job.id,
        "merchant_id": job.merchant_id,
        "merchant_name": merchant.legal_business_name if merchant else "Unknown",
        "risk_level": merchant.risk_level if merchant else "medium",
        "trigger_reason": job.trigger_reason,
        "tier_reached": job.tier_reached,
        "status": job.status,
        "result_summary": job.result_summary,
        "cost_saved": job.cost_saved,
        "last_checked_at": job.last_checked_at.isoformat() + ("Z" if not job.last_checked_at.tzinfo else ""),
        "next_check_due": job.next_check_due,
        "tier_details": tier_details,
    }


@router.get("")
def list_rechecks(db: Session = Depends(get_db)):
    # Group jobs by merchant_id to avoid duplicates (show only latest job per merchant)
    all_jobs = db.query(RecheckJob).order_by(RecheckJob.id.desc()).all()
    unique_jobs = []
    seen_merchants = set()
    for job in all_jobs:
        if job.merchant_id not in seen_merchants:
            merchant = db.get(Merchant, job.merchant_id)
            if merchant and merchant.status != "REJECTED":
                unique_jobs.append(job)
            seen_merchants.add(job.merchant_id)
            
    return [serialize_job(db, job) for job in unique_jobs]


@router.post("/{merchant_id}/run")
def run(merchant_id: int, payload: RecheckRequest, db: Session = Depends(get_db)):
    try:
        job = run_recheck(db, merchant_id, payload.trigger_reason)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    return serialize_job(db, job)


@router.post("/{merchant_id}/trigger-event")
def trigger_event(merchant_id: int, payload: EventTriggerRequest, db: Session = Depends(get_db)):
    """
    Event-driven recheck bypass. Called when anomalous merchant activity is detected
    (e.g., transaction spike, complaint spike). This immediately triggers a full
    recheck pipeline regardless of the next scheduled check date.
    """
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(404, "Merchant not found")

    event_map = {
        "TRANSACTION_SPIKE": "Automatic: Transaction volume spike detected",
        "COMPLAINT_SPIKE": "Automatic: Customer complaint rate exceeded threshold",
        "CONTENT_CHANGE": "Automatic: Website content change detected via webhook",
        "MANUAL": f"Manual trigger: {payload.details or 'Admin initiated'}",
    }
    reason = event_map.get(payload.event_type, f"Event: {payload.event_type}")

    # Escalate risk level for spikes
    if payload.event_type in ("TRANSACTION_SPIKE", "COMPLAINT_SPIKE"):
        if merchant.risk_level == "low":
            merchant.risk_level = "medium"
        elif merchant.risk_level == "medium":
            merchant.risk_level = "high"
        db.commit()

    log_event(db, merchant_id, "Event trigger", f"{payload.event_type}: {payload.details}")

    try:
        job = run_recheck(db, merchant_id, reason)
    except ValueError as exc:
        raise HTTPException(500, str(exc)) from exc

    result = serialize_job(db, job)

    # Include auto-action info
    result["event_type"] = payload.event_type
    result["risk_escalated"] = payload.event_type in ("TRANSACTION_SPIKE", "COMPLAINT_SPIKE")
    result["auto_action_taken"] = job.status == "AI_REVIEW" and merchant.status == "RESTRICTED"
    result["new_payout_limit"] = merchant.payout_limit

    return result
