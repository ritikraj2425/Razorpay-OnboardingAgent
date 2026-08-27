from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.merchant import Merchant
from app.models.recheck_job import RecheckJob
from app.services.recheck_orchestrator import run_recheck

_scheduler: BackgroundScheduler | None = None


def _cadence_days(risk_level: str) -> int:
    if risk_level == "high":
        return 1
    if risk_level == "medium":
        return 7
    if risk_level == "critical":
        return 1
    return 30


def schedule_initial_rechecks(db: Session, merchant: Merchant) -> None:
    now = datetime.utcnow()
    cadence = _cadence_days(merchant.risk_level)
    due_at = now + timedelta(days=cadence)
    
    db.add(
        RecheckJob(
            merchant_id=merchant.id,
            trigger_reason=f"Scheduled post-approval check ({merchant.risk_level} risk)",
            tier_reached=1,
            status="QUEUED",
            result_summary="Waiting for scheduled execution.",
            next_check_due=due_at.isoformat(),
            last_checked_at=now, # Pass datetime object, not string
        )
    )
    db.commit()


def _ensure_recurring_jobs(db: Session) -> None:
    merchants = db.query(Merchant).filter(Merchant.status.in_(["APPROVED", "RESTRICTED"])).all()
    for merchant in merchants:
        pending = (
            db.query(RecheckJob)
            .filter(RecheckJob.merchant_id == merchant.id, RecheckJob.status == "QUEUED")
            .count()
        )
        if pending:
            continue
        due_at = datetime.utcnow() + timedelta(days=_cadence_days(merchant.risk_level))
        db.add(
            RecheckJob(
                merchant_id=merchant.id,
                trigger_reason=f"Recurring {merchant.risk_level} risk check",
                status="QUEUED",
                result_summary="Waiting for scheduled execution.",
                next_check_due=due_at.isoformat(),
            )
        )
    db.commit()


def process_due_rechecks() -> None:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due_jobs = db.query(RecheckJob).filter(RecheckJob.status == "QUEUED").all()
        for job in due_jobs:
            if not job.next_check_due:
                continue
            try:
                due_at = datetime.fromisoformat(job.next_check_due)
            except ValueError:
                continue
            if due_at <= now:
                job.status = "RUNNING"
                db.commit()
                run_recheck(db, job.merchant_id, job.trigger_reason)
                job.status = "COMPLETED"
                db.commit()
        _ensure_recurring_jobs(db)
    finally:
        db.close()


def process_grace_periods() -> None:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find all merchants in PENDING_REMEDIATION where the deadline has passed
        expired_merchants = (
            db.query(Merchant)
            .filter(Merchant.status == "PENDING_REMEDIATION")
            .all()
        )
        for merchant in expired_merchants:
            if not merchant.remediation_deadline:
                continue
            try:
                deadline = datetime.fromisoformat(merchant.remediation_deadline)
            except ValueError:
                continue
            if deadline <= now:
                # Trigger a forced recheck. The recheck orchestrator will reject if score < 85
                run_recheck(db, merchant.id, "Grace period expired")
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(process_due_rechecks, "interval", minutes=30, id="sentinelpay_due_rechecks", replace_existing=True)
    _scheduler.add_job(process_grace_periods, "interval", minutes=30, id="sentinelpay_grace_periods", replace_existing=True)
    _scheduler.start()
    process_due_rechecks()
    process_grace_periods()
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
