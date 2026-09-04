import os
import uuid
import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.risk_signal import RiskSignal
from app.schemas.merchant_schema import MerchantCreate, MerchantOut
from app.schemas.verification_schema import VerificationResult, VerificationStep
from app.services.merchant_service import create_merchant

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "policies")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

@router.post("/upload")
async def upload_policy(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "doc.pdf")[1]
    stored_name = f"{uuid.uuid4().hex[:12]}{ext}"
    path = os.path.join(UPLOAD_DIR, stored_name)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return {"filename": stored_name, "size": len(content), "path": f"/uploads/policies/{stored_name}"}

@router.post("/register", response_model=VerificationResult)
def register(payload: MerchantCreate, db: Session = Depends(get_db)):
    merchant = create_merchant(db, payload)
    steps_data = json.loads(merchant.onboarding_steps) if merchant.onboarding_steps else []
    return VerificationResult(
        merchant=merchant,
        decision=merchant.status,
        score=merchant.trust_score,
        risk_level=merchant.risk_level,
        checklist=[],
        reason_codes=[],
        underwriter_memo="Processing in background...",
        steps=[VerificationStep(**s) for s in steps_data],
    )

@router.get("/{merchant_id}/status", response_model=VerificationResult)
def get_merchant_status(merchant_id: int, db: Session = Depends(get_db)):
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(404, "Merchant not found")
        
    steps_data = json.loads(merchant.onboarding_steps) if merchant.onboarding_steps else []
    
    from app.models.verification import Verification
    verif = db.query(Verification).filter(Verification.merchant_id == merchant_id).first()
    checklist = verif.checklist.split("|") if verif and verif.checklist else []
    reasons = verif.reason_codes.split("|") if verif and verif.reason_codes else []
    
    from app.models.ai_report import AIReport
    report = db.query(AIReport).filter(AIReport.merchant_id == merchant_id).first()
    memo = report.underwriter_memo if report else (
        "Approved via automated rules." if merchant.status == "APPROVED" else "Processing..."
    )

    return VerificationResult(
        merchant=merchant,
        decision=merchant.status,
        score=merchant.trust_score,
        risk_level=merchant.risk_level,
        checklist=checklist,
        reason_codes=reasons,
        underwriter_memo=memo,
        steps=[VerificationStep(**s) for s in steps_data],
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
    latest = snapshots[-1] if len(snapshots) > 1 else baseline
    
    return {
        "baseline": baseline,
        "latest": latest,
        "changed_product_categories": ["Replica watches"] if "replica" in latest.website_text.lower() else [],
        "changed_prices": latest.price_summary,
        "changed_policies": latest.policy_text,
        "semantic_drift_score": latest.semantic_drift_score,
        "risk_explanation": "High-risk catalog drift from approved baseline." if latest.semantic_drift_score > 0.25 else "No severe drift detected.",
    }
