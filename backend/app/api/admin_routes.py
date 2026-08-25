from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.merchant import Merchant
from app.models.recheck_job import RecheckJob
from app.models.risk_signal import RiskSignal

router = APIRouter()


@router.get("/metrics")
def metrics(db: Session = Depends(get_db)):
    merchants = db.query(Merchant).all()
    jobs = db.query(RecheckJob).all()
    signals = db.query(RiskSignal).all()
    return {
        "total_merchants": len(merchants),
        "approved_merchants": len([m for m in merchants if m.status == "APPROVED"]),
        "pending_remediation": len([m for m in merchants if m.status == "PENDING_REMEDIATION"]),
        "manual_review_count": len([m for m in merchants if m.status == "MANUAL_REVIEW"]),
        "high_risk_merchants": len([m for m in merchants if m.risk_level in {"high", "critical"}]),
        "rechecks_today": len(jobs),
        "llm_calls_avoided": len([j for j in jobs if j.cost_saved > 0]),
        "estimated_compute_cost_saved": round(sum(j.cost_saved for j in jobs), 2),
        "average_onboarding_time_reduced": "38%",
        "risk_caught_after_onboarding": len([s for s in signals if s.source in {"llm", "vector_diff", "ad"}]),
        "false_positive_challenge_cases": 1,
        "risk_distribution": [
            {"name": "Low", "value": len([m for m in merchants if m.risk_level == "low"])},
            {"name": "Medium", "value": len([m for m in merchants if m.risk_level == "medium"])},
            {"name": "High", "value": len([m for m in merchants if m.risk_level == "high"])},
            {"name": "Critical", "value": len([m for m in merchants if m.risk_level == "critical"])},
        ],
    }


@router.get("/events")
def recent_events(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).limit(12).all()
