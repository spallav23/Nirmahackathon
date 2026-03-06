"""
Redis Feature Store - store/retrieve processed telemetry features for ML.
Features: temperature_avg, voltage_variance, current_deviation, power_ratio, alarm_frequency, etc.
"""
import json
import os
from typing import Any


def _get_client():
    try:
        import redis
        url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        return redis.from_url(url, decode_responses=True)
    except Exception:
        return None


def get_features(inverter_id: str) -> dict[str, float] | None:
    """Retrieve stored features for an inverter from Redis."""
    client = _get_client()
    if not client:
        return None
    try:
        key = f"inverter:features:{inverter_id}"
        data = client.get(key)
        return json.loads(data) if data else None
    except Exception:
        return None


def set_features(inverter_id: str, features: dict[str, float], ttl_sec: int = 86400) -> bool:
    """Store processed features for an inverter in Redis."""
    client = _get_client()
    if not client:
        return False
    try:
        key = f"inverter:features:{inverter_id}"
        client.setex(key, ttl_sec, json.dumps(features))
        return True
    except Exception:
        return False
