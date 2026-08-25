from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.risk_signal import RiskSignal
from app.schemas.merchant_schema import MerchantCreate, MerchantOut
from app.schemas.verification_schema import VerificationResult
from app.services.merchant_service import create_merchant

router = APIRouter()


@router.post("/register", response_model=VerificationResult)
def register(payload: MerchantCreate, db: Session = Depends(get_db)):
    merchant, checklist, reasons, memo = create_merchant(db, payload)
    return VerificationResult(
        merchant=merchant,
        decision=merchant.status,
        score=merchant.trust_score,
        risk_level=merchant.risk_level,
        checklist=checklist,
        reason_codes=reasons,
        underwriter_memo=memo,
    )


@router.get("", response_model=list[MerchantOut])
def list_merchants(db: Session = Depends(get_db)):
    return db.query(Merchant).order_by(Merchant.id.asc()).all()


@router.get("/{merchant_id}")
def get_merchant(merchant_id: int, db: Session = Depends(get_db)):
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(404, "Merchant not found")
    snapshots = db.query(MerchantSnapshot).filter(MerchantSnapshot.merchant_id == merchant_id).order_by(MerchantSnapshot.id.desc()).all()
    signals = db.query(RiskSignal).filter(RiskSignal.merchant_id == merchant_id).order_by(RiskSignal.id.desc()).all()
    audit = db.query(AuditLog).filter(AuditLog.merchant_id == merchant_id).order_by(AuditLog.id.desc()).all()
    return {"merchant": merchant, "snapshots": snapshots, "signals": signals, "audit": audit}


@router.get("/{merchant_id}/diff")
def get_diff(merchant_id: int, db: Session = Depends(get_db)):
    snapshots = db.query(MerchantSnapshot).filter(MerchantSnapshot.merchant_id == merchant_id).order_by(MerchantSnapshot.id.asc()).all()
    if not snapshots:
        raise HTTPException(404, "Snapshots not found")
    baseline = snapshots[0]
    latest = snapshots[-1]
    return {
        "baseline": baseline,
        "latest": latest,
        "changed_product_categories": ["Replica watches"] if "replica" in latest.website_text.lower() else [],
        "changed_prices": latest.price_summary,
        "changed_policies": latest.policy_text,
        "semantic_drift_score": latest.semantic_drift_score,
        "risk_explanation": "High-risk catalog drift from approved baseline." if latest.semantic_drift_score > 0.25 else "No severe drift detected.",
    }
