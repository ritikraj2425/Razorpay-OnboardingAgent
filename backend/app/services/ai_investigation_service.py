from abc import ABC, abstractmethod
import json
from typing import Optional

import httpx

from app.core.config import settings
from app.schemas.ai_schema import AIInvestigationReport, Evidence


def _first_matching_quote(source_text: str, needles: list[str]) -> str:
    lower = source_text.lower()
    for needle in needles:
        index = lower.find(needle)
        if index >= 0:
            start = max(0, index - 60)
            end = min(len(source_text), index + 120)
            return source_text[start:end].strip()
    return source_text[:180].strip()


# ══════════════════════════════════════════════════════════════════════
# 1. STRATEGY PATTERN: LLM Investigation Strategies
# ══════════════════════════════════════════════════════════════════════

class LLMStrategy(ABC):
    """
    Abstract Strategy Interface for AI Underwriter investigations.
    Demonstrates:
      - Strategy Pattern: Encapsulates model-specific invocation algorithms.
      - Abstraction: Defines a common contract regardless of AI provider.
      - Polymorphism: Different models (Groq, OpenAI, Rule-based) adhere to the same signature.
    """
    @abstractmethod
    def generate_report(
        self,
        merchant_name: str,
        trigger: str,
        source_text: str,
        source_url: str = "crawl://latest",
        kyc_data: str = "",
    ) -> Optional[AIInvestigationReport]:
        pass


class OpenAIBasedLLMStrategy(LLMStrategy):
    """
    Base Strategy for OpenAI-compatible chat completion APIs (Groq, OpenAI, Ollama).
    Demonstrates OOP: Inheritance & Code Reusability.
    """
    def __init__(self, api_key: str, model: str, base_url: str, provider_name: str):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.provider_name = provider_name

    def generate_report(
        self,
        merchant_name: str,
        trigger: str,
        source_text: str,
        source_url: str = "crawl://latest",
        kyc_data: str = "",
    ) -> Optional[AIInvestigationReport]:
        if not self.api_key:
            return None

        prompt = {
            "merchant_name": merchant_name,
            "trigger": trigger,
            "source_url": source_url,
            "kyc_data": kyc_data,
            "crawled_text": source_text[:12000],
            "rules": [
                "Act as a Payment Gateway Go-Live Auditor.",
                "1. DUMMY CONTENT: Actively search for dummy data, lorem ipsum, or placeholder text (e.g., 'test1', 'demo', 'test course'). If found, flag it with reason code DUMMY_CONTENT_DETECTED and explicitly ask the merchant to add real products/courses.",
                "2. PROHIBITED GOODS: Check for illegal or high-risk categories (e.g., replica goods, gambling, miracle cures).",
                "3. BUSINESS LEGITIMACY: Ensure there is some indication of a real business (contact info, coherent pricing).",
                "4. REGISTRY MATCH: Cross-reference the website content with the provided kyc_data. If the website clearly belongs to a different business entity or the KYC data appears to be dummy/fake (e.g. Stakeholder 'Test'), you MUST flag it.",
                "5. EMPTY WEBSITE: If crawled_text is completely empty or indicates the website is unreachable (e.g. ConnectError), you MUST flag the merchant as 'critical' risk with reason code 'UNREACHABLE_WEBSITE'. Do NOT approve unreachable websites.",
                "Every high-risk claim must include a quote copied precisely from crawled_text.",
                "Do not invent facts.",
                "Permanent termination is not allowed; recommend human review for severe actions.",
            ],
        }
        schema = AIInvestigationReport.model_json_schema()
        try:
            response = httpx.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "temperature": 0.0,
                    "messages": [
                        {"role": "system", "content": "You are a merchant risk underwriter. Return only valid JSON."},
                        {"role": "user", "content": json.dumps(prompt)},
                    ],
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "name": "sentinelpay_underwriter_report",
                            "schema": schema,
                            "strict": True,
                        },
                    },
                },
                timeout=30.0,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            report = AIInvestigationReport.model_validate_json(content)
            verified_evidence = [
                item for item in report.evidence if not item.quote or item.quote.lower() in source_text.lower()
            ]
            return report.model_copy(update={"evidence": verified_evidence})
        except Exception:
            return None


class GroqLLMStrategy(OpenAIBasedLLMStrategy):
    """Concrete Strategy: Groq LPUs for ultra-low latency LLaMA inference."""
    def __init__(self):
        super().__init__(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            base_url="https://api.groq.com/openai/v1/chat/completions",
            provider_name="Groq",
        )


class OpenAILLMStrategy(OpenAIBasedLLMStrategy):
    """Concrete Strategy: OpenAI GPT models for structured underwriting."""
    def __init__(self):
        super().__init__(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            base_url="https://api.openai.com/v1/chat/completions",
            provider_name="OpenAI",
        )

class OpenAILLMStrategy(OpenAIBasedLLMStrategy):
    """Concrete Strategy: OpenAI GPT models for structured underwriting."""
    def __init__(self):
        super().__init__(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            base_url="https://api.openai.com/v1/chat/completions",
            provider_name="OpenAI",
        )

class RuleBasedFallbackStrategy(LLMStrategy):
    """
    Concrete Strategy: Offline, deterministic heuristic engine.
    Used as an immediate, zero-cost fallback when remote LLM APIs are unreachable or unconfigured.
    """
    def generate_report(
        self,
        merchant_name: str,
        trigger: str,
        source_text: str,
        source_url: str = "crawl://latest",
        kyc_data: str = "",
    ) -> AIInvestigationReport:
        lower = source_text.lower()

        if not source_text.strip() or "ConnectError" in source_text or "HTTP 0" in source_text:
            return AIInvestigationReport(
                risk_score=95,
                risk_level="critical",
                decision_recommendation="reject",
                reason_codes=["UNREACHABLE_WEBSITE"],
                evidence=[],
                underwriter_memo=f"{merchant_name} website ({source_url}) could not be reached or returned 0 content. Flagged as CRITICAL.",
                merchant_message="Your website could not be accessed by our agents. Please ensure the domain is active and publicly accessible without CAPTCHAs.",
            )

        if "replica" in lower or "guaranteed investment" in lower or "miracle cure" in lower or "betting" in lower:
            quote = _first_matching_quote(source_text, ["replica", "guaranteed investment", "miracle cure", "betting"])
            return AIInvestigationReport(
                risk_score=88,
                risk_level="high",
                decision_recommendation="lower_payout_limit",
                reason_codes=["HIGH_RISK_WEBSITE_CLAIM", "POLICY_OR_CATEGORY_MISMATCH"],
                evidence=[
                    Evidence(
                        type="website",
                        url=source_url,
                        quote=quote,
                        explanation="High-risk wording was found in crawled merchant content.",
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


# ══════════════════════════════════════════════════════════════════════
# 2. CONTEXT: Strategy Manager
# ══════════════════════════════════════════════════════════════════════

class AIInvestigationContext:
    """
    Strategy Context: Manages configured LLM strategies and executes
    graceful degradation (Groq -> OpenAI -> Rule-based fallback).
    """
    def __init__(self, strategies: Optional[list[LLMStrategy]] = None):
        if strategies is None:
            self.strategies: list[LLMStrategy] = [
                GroqLLMStrategy(),
                OpenAILLMStrategy(),
                RuleBasedFallbackStrategy(),
            ]
        else:
            self.strategies = strategies

    def investigate(
        self,
        merchant_name: str,
        trigger: str,
        source_text: str,
        source_url: str = "crawl://latest",
        kyc_data: str = "",
    ) -> AIInvestigationReport:
        for strategy in self.strategies:
            report = strategy.generate_report(
                merchant_name=merchant_name,
                trigger=trigger,
                source_text=source_text,
                source_url=source_url,
                kyc_data=kyc_data,
            )
            if report is not None:
                return report
        # Guarantee a report is always returned via fallback
        return RuleBasedFallbackStrategy().generate_report(
            merchant_name=merchant_name,
            trigger=trigger,
            source_text=source_text,
            source_url=source_url,
            kyc_data=kyc_data,
        )


# Global default context
_default_context = AIInvestigationContext()


# ══════════════════════════════════════════════════════════════════════
# 3. FACADE / PUBLIC API (Maintains 100% Backwards Compatibility)
# ══════════════════════════════════════════════════════════════════════

def generate_risk_report(
    merchant_name: str,
    trigger: str,
    source_text: str,
    source_url: str = "crawl://latest",
    kyc_data: str = "",
) -> AIInvestigationReport:
    """Public facade function delegating to the Strategy Context."""
    return _default_context.investigate(
        merchant_name=merchant_name,
        trigger=trigger,
        source_text=source_text,
        source_url=source_url,
        kyc_data=kyc_data,
    )


def generate_rule_based_report(
    merchant_name: str,
    trigger: str,
    source_text: str,
    source_url: str = "crawl://latest",
) -> AIInvestigationReport:
    """Direct rule-based execution for testing or forced offline mode."""
    return RuleBasedFallbackStrategy().generate_report(
        merchant_name=merchant_name,
        trigger=trigger,
        source_text=source_text,
        source_url=source_url,
    )
