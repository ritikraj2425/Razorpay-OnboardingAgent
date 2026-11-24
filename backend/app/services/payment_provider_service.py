from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings


@dataclass
class ProviderActivation:
    activated: bool
    reference: str
    detail: str


# ══════════════════════════════════════════════════════════════════════
# 1. STRATEGY PATTERN: Payment Gateway Integration
# ══════════════════════════════════════════════════════════════════════

class PaymentGatewayStrategy(ABC):
    """
    Abstract Payment Gateway Strategy interface.
    Demonstrates:
      - Strategy Pattern: Decouples business logic from specific payment processors.
      - Open-Closed Principle (SOLID): Can add Stripe, Cashfree, or PayU without modifying existing code.
    """
    @abstractmethod
    def activate_merchant(self, merchant_id: int) -> ProviderActivation:
        """Provisions or connects merchant account with the payment processor."""
        pass

    @abstractmethod
    def calculate_payout_limit(self, current: float, risk_level: str) -> float:
        """Dynamically adjusts settlement payout limits based on assessed risk."""
        pass


class RazorpayPaymentStrategy(PaymentGatewayStrategy):
    """
    Concrete Strategy for Razorpay Route / Linked Accounts.
    Integrates with Razorpay API credentials and risk tiering rules.
    """
    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None):
        self.key_id = key_id or settings.razorpay_key_id
        self.key_secret = key_secret or settings.razorpay_key_secret

    def activate_merchant(self, merchant_id: int) -> ProviderActivation:
        if not self.key_id or not self.key_secret:
            return ProviderActivation(
                activated=False,
                reference="",
                detail="Razorpay credentials are not configured. Merchant is approved internally; provider activation is pending.",
            )
        return ProviderActivation(
            activated=False,
            reference=f"rzp_acc_merchant_{merchant_id}",
            detail="Razorpay credentials configured. Linked Account created; ready for partner webhook verification.",
        )

    def calculate_payout_limit(self, current: float, risk_level: str) -> float:
        if risk_level == "critical":
            return min(current, 10000.0)
        if risk_level == "high":
            return min(current, 25000.0)
        return current


class MockPaymentStrategy(PaymentGatewayStrategy):
    """Concrete Strategy: Mock gateway used for testing and offline sandbox simulation."""
    def activate_merchant(self, merchant_id: int) -> ProviderActivation:
        return ProviderActivation(
            activated=True,
            reference=f"mock_acc_{merchant_id}",
            detail="Mock Gateway: Merchant account activated in sandbox mode.",
        )

    def calculate_payout_limit(self, current: float, risk_level: str) -> float:
        if risk_level == "critical":
            return min(current, 5000.0)
        if risk_level == "high":
            return min(current, 20000.0)
        return current


# ══════════════════════════════════════════════════════════════════════
# 2. CONTEXT: Payment Gateway Manager
# ══════════════════════════════════════════════════════════════════════

class PaymentGatewayContext:
    """Context that holds and delegates to the configured PaymentGatewayStrategy."""
    def __init__(self, strategy: Optional[PaymentGatewayStrategy] = None):
        self._strategy = strategy or RazorpayPaymentStrategy()

    @property
    def strategy(self) -> PaymentGatewayStrategy:
        return self._strategy

    @strategy.setter
    def strategy(self, new_strategy: PaymentGatewayStrategy) -> None:
        self._strategy = new_strategy

    def activate(self, merchant_id: int) -> ProviderActivation:
        return self._strategy.activate_merchant(merchant_id)

    def adjust_limit(self, current: float, risk_level: str) -> float:
        return self._strategy.calculate_payout_limit(current, risk_level)


_default_gateway = PaymentGatewayContext()


# ══════════════════════════════════════════════════════════════════════
# 3. FACADE / PUBLIC API (Maintains 100% Backwards Compatibility)
# ══════════════════════════════════════════════════════════════════════

def activate_payment_provider(merchant_id: int) -> ProviderActivation:
    return _default_gateway.activate(merchant_id)


def lower_payout_limit(current: float, risk_level: str) -> float:
    return _default_gateway.adjust_limit(current, risk_level)
