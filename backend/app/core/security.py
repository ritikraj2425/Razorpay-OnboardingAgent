def mask_account(account: str) -> str:
    if len(account) <= 4:
        return "****"
    return f"****{account[-4:]}"
