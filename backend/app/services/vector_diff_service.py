import math
from collections import Counter


def _vector(text: str) -> Counter:
    tokens = [token.strip(".,:;!?()[]").lower() for token in text.split()]
    return Counter(token for token in tokens if len(token) > 2)


def semantic_distance(a: str, b: str) -> float:
    va, vb = _vector(a), _vector(b)
    if not va or not vb:
        return 1.0
    common = set(va) | set(vb)
    dot = sum(va[t] * vb[t] for t in common)
    mag_a = math.sqrt(sum(v * v for v in va.values()))
    mag_b = math.sqrt(sum(v * v for v in vb.values()))
    return round(1 - (dot / (mag_a * mag_b)), 3)
