from enum import Enum


class MerchantStatus(str, Enum):
    APPROVED = "APPROVED"
    PENDING_REMEDIATION = "PENDING_REMEDIATION"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    REJECTED = "REJECTED"
    RESTRICTED = "RESTRICTED"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecheckStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    NO_CHANGE = "NO_CHANGE"
    WATCHLIST = "WATCHLIST"
    AI_REVIEW = "AI_REVIEW"
    COMPLETED = "COMPLETED"
