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
from app.services.website_intel_service import WebsiteIntel


def _snapshot(db, merchant: Merchant, kind: str = "baseline", drift: bool = False, score: float = 0):
    if drift:
        text = "Replica luxury watches, premium first-copy accessories, imported brand clones. 100% guaranteed authentic replicas."
        policies = "No returns on replica watches. All sales final."
        products = "Replica watches, luxury clones, first-copy bags"
        prices = "Watch Rs 2999, Bag Rs 1499"
    else:
        text = f"{merchant.legal_business_name} ({merchant.customer_facing_business_name}) sells {merchant.category} products with visible policies, active support, and transparent pricing."
        policies = "Refunds within 7 days of delivery. Free shipping on orders above Rs 499. Privacy policy and terms published."
        products = f"{merchant.category} catalog — {merchant.subcategory or 'general'}"
        prices = "Average product Rs 999"
    html = f"<html><head><title>{merchant.customer_facing_business_name or merchant.legal_business_name}</title></head><body>{text} {policies} {products} {prices}</body></html>"
    intel = WebsiteIntel(html=html, text=text, policy_text=policies, product_summary=products, price_summary=prices, support_summary=merchant.support_email, is_spa=False)
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
            # 1. Clean approved merchant — clothing
            Merchant(
                business_type="private_limited",
                legal_business_name="UrbanThreads Apparels Pvt Ltd",
                customer_facing_business_name="UrbanThreads",
                contact_name="Aarav Mehta",
                category="ecommerce",
                subcategory="clothing_and_accessories",
                mcc_code="5651",
                description="Premium casual wear and streetwear for millennials",
                pan="AABCU1234F",
                gst="27AABCU1234F1Z5",
                cin="U18101MH2019PTC123456",
                stakeholder_name="Aarav Mehta",
                stakeholder_pan="BBBPM1234A",
                stakeholder_designation="director",
                stakeholder_ownership_pct=65.0,
                registered_address="42, Linking Road, Bandra West",
                registered_city="Mumbai",
                registered_state="Maharashtra",
                registered_pincode="400050",
                operational_address="Same as registered",
                bank_account="50100112345678",
                ifsc="HDFC0001234",
                bank_name="HDFC Bank",
                beneficiary_name="UrbanThreads Apparels Pvt Ltd",
                website_url="https://www.myntra.com",
                social_links="instagram.com/urbanthreads",
                expected_monthly_volume=900000,
                expected_average_order_value=1200,
                refund_policy_url="https://www.myntra.com/refund",
                shipping_policy_url="https://www.myntra.com/shipping",
                privacy_policy_url="https://www.myntra.com/privacy",
                terms_url="https://www.myntra.com/terms",
                support_email="care@urbanthreads.in",
                support_phone="+919876543210",
                status="APPROVED",
                risk_level="low",
                trust_score=91,
                api_key="rzp_live_sp_urban_xxxx",
            ),
            # 2. Suspicious education merchant — missing policies, high AOV
            Merchant(
                business_type="proprietorship",
                legal_business_name="QuickCash Digital Academy",
                customer_facing_business_name="QuickCash Academy",
                contact_name="Neeraj Rao",
                category="education",
                subcategory="online_courses",
                mcc_code="8299",
                description="Get-rich-quick trading courses and crypto mentorship",
                pan="BKDPR1234Q",
                gst="29BKDPR1234Q1Z2",
                cin="",
                stakeholder_name="Neeraj Rao",
                stakeholder_pan="BKDPR1234Q",
                stakeholder_designation="executive",
                stakeholder_ownership_pct=100.0,
                registered_address="103, 1st Floor, HSR Layout",
                registered_city="Bengaluru",
                registered_state="Karnataka",
                registered_pincode="560102",
                operational_address="Same as registered",
                bank_account="222200002222",
                ifsc="ICIC0000123",
                bank_name="ICICI Bank",
                beneficiary_name="Neeraj Rao",
                website_url="https://quickcash.example",
                social_links="",
                expected_monthly_volume=3500000,
                expected_average_order_value=14999,
                refund_policy_url="",
                shipping_policy_url="",
                privacy_policy_url="/privacy",
                terms_url="/terms",
                support_email="help@quickcash.example",
                support_phone="+919900000000",
                status="MANUAL_REVIEW",
                risk_level="high",
                trust_score=44,
            ),
            # 3. Drift scenario — clothing → replica watches
            Merchant(
                business_type="llp",
                legal_business_name="StyleBazaar Fashion LLP",
                customer_facing_business_name="StyleBazaar",
                contact_name="Meera Shah",
                category="ecommerce",
                subcategory="clothing_and_accessories",
                mcc_code="5699",
                description="Fashion accessories and trendy clothing",
                pan="AADFS1234S",
                gst="07AADFS1234S1Z1",
                cin="AAA-0001",
                stakeholder_name="Meera Shah",
                stakeholder_pan="CCCPS1234M",
                stakeholder_designation="executive",
                stakeholder_ownership_pct=50.0,
                registered_address="D-14, Karol Bagh",
                registered_city="New Delhi",
                registered_state="Delhi",
                registered_pincode="110005",
                operational_address="Same as registered",
                bank_account="333300003333",
                ifsc="SBIN0000456",
                bank_name="State Bank of India",
                beneficiary_name="StyleBazaar Fashion LLP",
                website_url="https://stylebazaar.example",
                social_links="instagram.com/stylebazaar",
                expected_monthly_volume=1200000,
                expected_average_order_value=999,
                refund_policy_url="/refunds",
                shipping_policy_url="/shipping",
                privacy_policy_url="/privacy",
                terms_url="/terms",
                support_email="support@stylebazaar.in",
                support_phone="+918888888888",
                status="RESTRICTED",
                risk_level="high",
                trust_score=72,
                payout_limit=25000,
            ),
            # 4. Ad mismatch scenario — electronics
            Merchant(
                business_type="private_limited",
                legal_business_name="GadgetFlash Technologies Pvt Ltd",
                customer_facing_business_name="GadgetFlash",
                contact_name="Kabir Khan",
                category="ecommerce",
                subcategory="electronics_and_gadgets",
                mcc_code="5732",
                description="Consumer electronics and mobile accessories",
                pan="AABCG1234T",
                gst="19AABCG1234T1Z8",
                cin="U74999WB2020PTC234567",
                stakeholder_name="Kabir Khan",
                stakeholder_pan="DDDPK1234K",
                stakeholder_designation="director",
                stakeholder_ownership_pct=80.0,
                registered_address="Salt Lake Sector V, Building 12",
                registered_city="Kolkata",
                registered_state="West Bengal",
                registered_pincode="700091",
                operational_address="Same as registered",
                bank_account="444400004444",
                ifsc="KKBK0001234",
                bank_name="Kotak Mahindra Bank",
                beneficiary_name="GadgetFlash Technologies Pvt Ltd",
                website_url="https://gadgetflash.example",
                social_links="",
                expected_monthly_volume=6000000,
                expected_average_order_value=7999,
                refund_policy_url="/refunds",
                shipping_policy_url="/shipping",
                privacy_policy_url="/privacy",
                terms_url="/terms",
                support_email="support@gadgetflash.in",
                support_phone="+917777777777",
                status="MANUAL_REVIEW",
                risk_level="high",
                trust_score=58,
            ),
            # 5. Remediation scenario — health supplements
            Merchant(
                business_type="proprietorship",
                legal_business_name="AyurvedaPlus Wellness",
                customer_facing_business_name="AyurvedaPlus",
                contact_name="Isha Nair",
                category="healthcare",
                subcategory="ayurveda_and_supplements",
                mcc_code="5912",
                description="Ayurvedic health supplements and wellness products",
                pan="BBBPI1234P",
                gst="33BBBPI1234P1Z4",
                cin="",
                stakeholder_name="Isha Nair",
                stakeholder_pan="BBBPI1234P",
                stakeholder_designation="executive",
                stakeholder_ownership_pct=100.0,
                registered_address="56, T Nagar, Anna Salai",
                registered_city="Chennai",
                registered_state="Tamil Nadu",
                registered_pincode="600017",
                operational_address="Same as registered",
                bank_account="555500005555",
                ifsc="UTIB0007890",
                bank_name="Axis Bank",
                beneficiary_name="Isha Nair",
                website_url="https://ayurvedaplus.example",
                social_links="",
                expected_monthly_volume=500000,
                expected_average_order_value=799,
                refund_policy_url="",
                shipping_policy_url="/shipping",
                privacy_policy_url="/privacy",
                terms_url="/terms",
                support_email="care@ayurvedaplus.in",
                support_phone="+916666666666",
                status="PENDING_REMEDIATION",
                risk_level="medium",
                trust_score=68,
                remediation_deadline=(datetime.utcnow() + timedelta(hours=38)).isoformat(),
            ),
            # 6. Clean approved — festival wear
            Merchant(
                business_type="partnership",
                legal_business_name="FestiveWear Collections",
                customer_facing_business_name="FestiveWear",
                contact_name="Dev Patel",
                category="ecommerce",
                subcategory="ethnic_wear",
                mcc_code="5621",
                description="Traditional Indian ethnic wear and festival clothing",
                pan="AABFF1234W",
                gst="24AABFF1234W1Z3",
                cin="",
                stakeholder_name="Dev Patel",
                stakeholder_pan="EEEPD1234P",
                stakeholder_designation="executive",
                stakeholder_ownership_pct=50.0,
                registered_address="CG Road, Navrangpura",
                registered_city="Ahmedabad",
                registered_state="Gujarat",
                registered_pincode="380009",
                operational_address="Same as registered",
                bank_account="666600006666",
                ifsc="YESB0000123",
                bank_name="Yes Bank",
                beneficiary_name="FestiveWear Collections",
                website_url="https://www.ajio.com",
                social_links="",
                expected_monthly_volume=1800000,
                expected_average_order_value=1500,
                refund_policy_url="https://www.ajio.com/return-refund-policy",
                shipping_policy_url="https://www.ajio.com/shipping-policy",
                privacy_policy_url="https://www.ajio.com/privacy-policy",
                terms_url="https://www.ajio.com/terms-of-sale",
                support_email="hello@festivewear.in",
                support_phone="+915555555555",
                status="APPROVED",
                risk_level="low",
                trust_score=89,
            ),
            # 7-8. Shell network (same bank account)
            Merchant(
                business_type="proprietorship",
                legal_business_name="StoreClone Network A",
                customer_facing_business_name="Clone Store A",
                contact_name="Ravi Sharma",
                category="ecommerce",
                subcategory="accessories",
                mcc_code="5999",
                description="Generic accessories and imports",
                pan="CCCPS1234A",
                gst="06CCCPS1234A1Z9",
                cin="",
                stakeholder_name="Ravi Sharma",
                stakeholder_pan="CCCPS1234A",
                stakeholder_designation="executive",
                stakeholder_ownership_pct=100.0,
                registered_address="Sector 18, Noida",
                registered_city="Noida",
                registered_state="Haryana",
                registered_pincode="201301",
                operational_address="Same as registered",
                bank_account="999900009999",
                ifsc="PUNB0002222",
                bank_name="Punjab National Bank",
                beneficiary_name="Ravi Sharma",
                website_url="https://clone-a.example",
                social_links="",
                expected_monthly_volume=200000,
                expected_average_order_value=600,
                refund_policy_url="/refunds",
                shipping_policy_url="/shipping",
                privacy_policy_url="/privacy",
                terms_url="/terms",
                support_email="a@clone.example",
                support_phone="+914444444444",
                status="MANUAL_REVIEW",
                risk_level="high",
                trust_score=52,
            ),
            Merchant(
                business_type="proprietorship",
                legal_business_name="StoreClone Network B",
                customer_facing_business_name="Clone Store B",
                contact_name="Ravi Sharma",
                category="ecommerce",
                subcategory="accessories",
                mcc_code="5999",
                description="Generic accessories and imports",
                pan="CCCPS1234B",
                gst="06CCCPS1234B1Z8",
                cin="",
                stakeholder_name="Ravi Sharma",
                stakeholder_pan="CCCPS1234B",
                stakeholder_designation="executive",
                stakeholder_ownership_pct=100.0,
                registered_address="Sector 18, Noida",
                registered_city="Noida",
                registered_state="Haryana",
                registered_pincode="201301",
                operational_address="Same as registered",
                bank_account="999900009999",
                ifsc="PUNB0002222",
                bank_name="Punjab National Bank",
                beneficiary_name="Ravi Sharma",
                website_url="https://clone-b.example",
                social_links="",
                expected_monthly_volume=200000,
                expected_average_order_value=600,
                refund_policy_url="/refunds",
                shipping_policy_url="/shipping",
                privacy_policy_url="/privacy",
                terms_url="/terms",
                support_email="b@clone.example",
                support_phone="+914444444445",
                status="MANUAL_REVIEW",
                risk_level="high",
                trust_score=51,
            ),
        ]
        db.add_all(merchants)
        db.commit()
        for merchant in merchants:
            db.refresh(merchant)
            _snapshot(db, merchant)
            db.add(AuditLog(merchant_id=merchant.id, event="Baseline created", details=f"Seed score {merchant.trust_score}"))

        # StyleBazaar drift scenario
        style = merchants[2]
        _snapshot(db, style, kind="latest", drift=True, score=0.61)
        db.add(RecheckJob(merchant_id=style.id, trigger_reason="Day-10 catalog drift", tier_reached=4, status="AI_REVIEW", result_summary="Replica watches detected after approval. Payout limit lowered.", cost_saved=0, tier_details='[{"tier":1,"name":"Website Availability","status":"passed","detail":"HTTP 200 · 3 pages crawled","duration_ms":1200},{"tier":2,"name":"Hash Comparison","status":"changed","detail":"SHA-256 mismatch detected","duration_ms":80},{"tier":3,"name":"Semantic Drift Analysis","status":"escalated","detail":"Cosine distance 0.610 — significant content change","duration_ms":150},{"tier":4,"name":"AI Deep Investigation","status":"flagged","detail":"LLM risk score: 88 · Recommendation: lower_payout_limit · 2 evidence items","duration_ms":4200}]'))
        db.add(RiskSignal(merchant_id=style.id, level="high", source="llm", reason_code="CATALOG_DRIFT", description="Clothing baseline changed to replica luxury watches."))
        db.add(AIReport(merchant_id=style.id, risk_score=88, risk_level="high", decision_recommendation="lower_payout_limit", reason_codes="CATALOG_DRIFT|COUNTERFEIT_RISK", evidence="sample://crawl/stylebazaar", underwriter_memo="Approved clothing merchant now advertises replica watches. Lower payout limit and request invoices.", merchant_message="Please provide inventory invoices and catalog clarification."))
        db.add(HumanReviewCase(merchant_id=style.id, suggested_action="lower_payout_limit", memo="Approved clothing merchant now advertises replica watches. Lower payout limit and request invoices."))

        # GadgetFlash ad mismatch
        gadget = merchants[3]
        db.add(AdSnapshot(merchant_id=gadget.id, headline="iPhone for Rs 999 today", body="Urgent sale with 30-day money-back guarantee.", landing_page_url="https://gadgetflash.example/hidden-iphone", claimed_price=999, claimed_refund="30-day guarantee", flags="BAIT_AND_SWITCH_PRICING|POLICY_MISMATCH"))
        db.add(RiskSignal(merchant_id=gadget.id, level="high", source="ad", reason_code="BAIT_AND_SWITCH_PRICING", description="Ad says Rs 999 while site checkout shows Rs 7999."))
        db.add(HumanReviewCase(merchant_id=gadget.id, suggested_action="temporary_hold", memo="Sample ad mismatch: iPhone advertised at Rs 999, checkout shows Rs 7999, refund guarantee conflicts with exclusions."))

        # FestiveWear transaction spike
        festive = merchants[5]
        db.add(TransactionSummary(merchant_id=festive.id, refund_rate=0.02, chargeback_rate=0.003, velocity_spike=3.4, complaint_count=2))
        db.add(RiskSignal(merchant_id=festive.id, level="low", source="transaction", reason_code="LEGITIMATE_SALES_SPIKE_CHALLENGED", description="Festival sale context accepted. No payout freeze."))
        db.commit()
    finally:
        db.close()
