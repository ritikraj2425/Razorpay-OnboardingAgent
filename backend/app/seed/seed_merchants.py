from datetime import datetime, timedelta

from app.db.session import SessionLocal
from app.models.ad_snapshot import AdSnapshot
from app.models.ai_report import AIReport
from app.models.audit_log import AuditLog
from app.models.human_review_case import HumanReviewCase
from app.models.merchant import Merchant
from app.models.merchant_snapshot import MerchantSnapshot
from app.models.recheck_job import RecheckJob
from app.models.risk_signal import RiskSignal
from app.models.transaction_summary import TransactionSummary
from app.services.hash_diff_service import sha256_text
from app.services.website_intel_service import mock_site_for


def _snapshot(db, merchant: Merchant, kind: str = "baseline", drift: bool = False, score: float = 0):
    intel = mock_site_for(merchant.business_name, merchant.category, drift=drift)
    db.add(
        MerchantSnapshot(
            merchant_id=merchant.id,
            kind=kind,
            html_hash=sha256_text(intel.html),
            website_text=intel.text,
            policy_text=intel.policy_text,
            product_summary=intel.product_summary,
            price_summary=intel.price_summary,
            support_summary=intel.support_summary,
            semantic_drift_score=score,
        )
    )


def seed_database() -> None:
    db = SessionLocal()
    try:
        if db.query(Merchant).count():
            return
        merchants = [
            Merchant(business_name="UrbanThreads", owner_name="Aarav Mehta", category="Clothing", pan="ABCDE1234F", gst="27ABCDE1234F1Z5", bank_account="111100001111", ifsc="HDFC0001234", website_url="https://urbanthreads.example", social_links="instagram.com/urbanthreads", expected_monthly_volume=900000, expected_average_order_value=1200, refund_policy_url="/refunds", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="care@urbanthreads.example", support_phone="+919876543210", status="APPROVED", risk_level="low", trust_score=91, api_key="rzp_test_sp_urban"),
            Merchant(business_name="QuickCash Academy", owner_name="Neeraj Rao", category="Education", pan="QQQQQ1234Q", gst="29QQQQQ1234Q1Z2", bank_account="222200002222", ifsc="ICIC0000123", website_url="https://quickcash.example", social_links="", expected_monthly_volume=3500000, expected_average_order_value=14999, refund_policy_url="", shipping_policy_url="", privacy_policy_url="/privacy", terms_url="/terms", support_email="help@quickcash.example", support_phone="+919900000000", status="MANUAL_REVIEW", risk_level="high", trust_score=44),
            Merchant(business_name="StyleBazaar", owner_name="Meera Shah", category="Clothing", pan="STYLE1234S", gst="07STYLE1234S1Z1", bank_account="333300003333", ifsc="SBIN0000456", website_url="https://stylebazaar.example", social_links="instagram.com/stylebazaar", expected_monthly_volume=1200000, expected_average_order_value=999, refund_policy_url="/refunds", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="support@stylebazaar.example", support_phone="+918888888888", status="RESTRICTED", risk_level="high", trust_score=72, payout_limit=25000),
            Merchant(business_name="GadgetFlash", owner_name="Kabir Khan", category="Electronics", pan="GADGE1234T", gst="19GADGE1234T1Z8", bank_account="444400004444", ifsc="KKBK0001234", website_url="https://gadgetflash.example", social_links="", expected_monthly_volume=6000000, expected_average_order_value=7999, refund_policy_url="/refunds", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="support@gadgetflash.example", support_phone="+917777777777", status="MANUAL_REVIEW", risk_level="high", trust_score=58),
            Merchant(business_name="AyurvedaPlus", owner_name="Isha Nair", category="Health supplements", pan="AYURV1234P", gst="33AYURV1234P1Z4", bank_account="555500005555", ifsc="UTIB0007890", website_url="https://ayurvedaplus.example", social_links="", expected_monthly_volume=500000, expected_average_order_value=799, refund_policy_url="", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="care@ayurvedaplus.example", support_phone="+916666666666", status="PENDING_REMEDIATION", risk_level="medium", trust_score=68, remediation_deadline=(datetime.utcnow() + timedelta(hours=38)).isoformat()),
            Merchant(business_name="FestiveWear", owner_name="Dev Patel", category="Clothing", pan="FESTI1234W", gst="24FESTI1234W1Z3", bank_account="666600006666", ifsc="YESB0000123", website_url="https://festivewear.example", social_links="", expected_monthly_volume=1800000, expected_average_order_value=1500, refund_policy_url="/refunds", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="hello@festivewear.example", support_phone="+915555555555", status="APPROVED", risk_level="low", trust_score=89),
            Merchant(business_name="StoreClone Network A", owner_name="Ravi S", category="Accessories", pan="CLONE1234A", gst="06CLONE1234A1Z9", bank_account="999900009999", ifsc="PUNB0002222", website_url="https://clone-a.example", social_links="", expected_monthly_volume=200000, expected_average_order_value=600, refund_policy_url="/refunds", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="a@clone.example", support_phone="+914444444444", status="MANUAL_REVIEW", risk_level="high", trust_score=52),
            Merchant(business_name="StoreClone Network B", owner_name="Ravi S", category="Accessories", pan="CLONE1234B", gst="06CLONE1234B1Z8", bank_account="999900009999", ifsc="PUNB0002222", website_url="https://clone-b.example", social_links="", expected_monthly_volume=200000, expected_average_order_value=600, refund_policy_url="/refunds", shipping_policy_url="/shipping", privacy_policy_url="/privacy", terms_url="/terms", support_email="b@clone.example", support_phone="+914444444445", status="MANUAL_REVIEW", risk_level="high", trust_score=51),
        ]
        db.add_all(merchants)
        db.commit()
        for merchant in merchants:
            db.refresh(merchant)
            _snapshot(db, merchant)
            db.add(AuditLog(merchant_id=merchant.id, event="Baseline created", details=f"Seed score {merchant.trust_score}"))

        style = merchants[2]
        _snapshot(db, style, kind="latest", drift=True, score=0.61)
        db.add(RecheckJob(merchant_id=style.id, trigger_reason="Day-10 catalog drift", tier_reached=4, status="AI_REVIEW", result_summary="Replica watches detected after approval. Payout limit lowered.", cost_saved=0))
        db.add(RiskSignal(merchant_id=style.id, level="high", source="llm", reason_code="CATALOG_DRIFT", description="Clothing baseline changed to replica luxury watches."))
        db.add(AIReport(merchant_id=style.id, risk_score=88, risk_level="high", decision_recommendation="lower_payout_limit", reason_codes="CATALOG_DRIFT|COUNTERFEIT_RISK", evidence="mock://crawl/stylebazaar", underwriter_memo="Approved clothing merchant now advertises replica watches. Lower payout limit and request invoices.", merchant_message="Please provide inventory invoices and catalog clarification."))
        db.add(HumanReviewCase(merchant_id=style.id, suggested_action="lower_payout_limit", memo="Approved clothing merchant now advertises replica watches. Lower payout limit and request invoices."))

        gadget = merchants[3]
        db.add(AdSnapshot(merchant_id=gadget.id, headline="iPhone for Rs 999 today", body="Urgent sale with 30-day money-back guarantee.", landing_page_url="https://gadgetflash.example/hidden-iphone", claimed_price=999, claimed_refund="30-day guarantee", flags="BAIT_AND_SWITCH_PRICING|POLICY_MISMATCH"))
        db.add(RiskSignal(merchant_id=gadget.id, level="high", source="ad", reason_code="BAIT_AND_SWITCH_PRICING", description="Ad says Rs 999 while site checkout shows Rs 7999."))
        db.add(HumanReviewCase(merchant_id=gadget.id, suggested_action="temporary_hold", memo="Mock Meta ad mismatch: iPhone advertised at Rs 999, checkout shows Rs 7999, refund guarantee conflicts with exclusions."))

        festive = merchants[5]
        db.add(TransactionSummary(merchant_id=festive.id, refund_rate=0.02, chargeback_rate=0.003, velocity_spike=3.4, complaint_count=2))
        db.add(RiskSignal(merchant_id=festive.id, level="low", source="transaction", reason_code="LEGITIMATE_SALES_SPIKE_CHALLENGED", description="Festival sale context accepted. No payout freeze."))
        db.commit()
    finally:
        db.close()
