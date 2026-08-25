import hashlib


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def hash_changed(previous: str, latest: str) -> bool:
    return previous != latest
