"""
SentinelPay Multi-Agent Autonomous Risk Verification Architecture
OOP: Demonstrates Abstraction, Inheritance, Polymorphism, and Template Method Pattern.
"""
from app.agents.base import BaseAgent, AgentResult
from app.agents.document_consistency_agent import DocumentConsistencyAgent
from app.agents.website_risk_agent import WebsiteRiskAgent
from app.agents.drift_detection_agent import DriftDetectionAgent
from app.agents.ad_policy_mismatch_agent import AdPolicyMismatchAgent
from app.agents.underwriter_report_agent import UnderwriterReportAgent

__all__ = [
    "BaseAgent",
    "AgentResult",
    "DocumentConsistencyAgent",
    "WebsiteRiskAgent",
    "DriftDetectionAgent",
    "AdPolicyMismatchAgent",
    "UnderwriterReportAgent",
]
