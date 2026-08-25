import secrets


def create_sandbox_keys(merchant_id: int) -> str:
    return f"rzp_test_sp_{merchant_id}_{secrets.token_hex(8)}"


def lower_payout_limit(current: float, risk_level: str) -> float:
    if risk_level == "critical":
        return min(current, 10000)
    if risk_level == "high":
        return min(current, 25000)
    return current
