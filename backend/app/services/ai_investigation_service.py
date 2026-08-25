from app.schemas.ai_schema import AIInvestigationReport, Evidence


def generate_mock_report(merchant_name: str, trigger: str, source_text: str) -> AIInvestigationReport:
    lower = source_text.lower()
    if "replica" in lower or "iphone rs 7999" in lower or "guaranteed investment" in lower:
        quote = "Replica luxury watches" if "replica" in source_text else source_text[:80]
        return AIInvestigationReport(
            risk_score=88,
            risk_level="high",
            decision_recommendation="lower_payout_limit",
            reason_codes=["CATALOG_DRIFT", "POLICY_OR_AD_MISMATCH"],
            evidence=[
                Evidence(
                    type="website",
                    url="mock://crawl/latest",
                    quote=quote,
                    explanation="Verified high-risk wording appears in crawled content.",
                )
            ],
            underwriter_memo=f"{merchant_name} requires manual review after {trigger}. Evidence supports payout limit reduction pending clarification.",
            merchant_message="Please clarify the changed catalog and provide supporting invoices or policy corrections.",
        )
    return AIInvestigationReport(
        risk_score=28,
        risk_level="low",
        decision_recommendation="approve",
        reason_codes=["BENIGN_CHANGE"],
        evidence=[],
        underwriter_memo=f"{merchant_name} shows benign drift. No severe action recommended.",
        merchant_message="No action needed.",
    )
