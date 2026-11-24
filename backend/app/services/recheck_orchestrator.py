import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.recheck_job import RecheckJob
from app.services.audit_service import log_event
from app.services.recheck_chain import RecheckContext, build_default_recheck_chain


def run_recheck(db: Session, merchant_id: int, trigger_reason: str) -> RecheckJob:
    """
    Executes a periodic or event-triggered recheck for a merchant.
    Uses the Chain of Responsibility Pattern (4-Tier Cascade) to minimize compute and LLM API cost.
    """
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise ValueError("Merchant not found")

    baseline = (
        db.query(MerchantSnapshot)
        .filter(MerchantSnapshot.merchant_id == merchant_id, MerchantSnapshot.kind == "baseline")
        .order_by(MerchantSnapshot.id.asc())
        .first()
    )

    cadence = 30
    if merchant.risk_level in ("critical", "high"):
        cadence = 1
    elif merchant.risk_level == "medium":
        cadence = 7

    job = RecheckJob(
        merchant_id=merchant_id,
        trigger_reason=trigger_reason,
        next_check_due=(datetime.utcnow() + timedelta(days=cadence)).isoformat(),
        last_checked_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    log_event(db, merchant_id, "Recheck triggered", trigger_reason)

    # Initialize Context and execute the Chain of Responsibility
    ctx = RecheckContext(
        db=db,
        merchant=merchant,
        trigger_reason=trigger_reason,
        baseline=baseline,
    )

    chain = build_default_recheck_chain()
    ctx = chain.handle(ctx)

    # Finalize RecheckJob attributes from Context
    job.tier_reached = ctx.tier_reached
    job.status = ctx.status
    job.result_summary = ctx.result_summary
    job.cost_saved = ctx.cost_saved
    job.tier_details = json.dumps(ctx.tier_details)

    db.commit()
    db.refresh(job)
    return job
