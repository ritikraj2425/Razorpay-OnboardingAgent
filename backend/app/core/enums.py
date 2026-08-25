from enum import StrEnum


class MerchantStatus(StrEnum):
    APPROVED = "APPROVED"
    PENDING_REMEDIATION = "PENDING_REMEDIATION"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    REJECTED = "REJECTED"
    RESTRICTED = "RESTRICTED"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecheckStatus(StrEnum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    NO_CHANGE = "NO_CHANGE"
    WATCHLIST = "WATCHLIST"
    AI_REVIEW = "AI_REVIEW"
    COMPLETED = "COMPLETED"
