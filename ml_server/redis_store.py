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


def set_training_progress(status: str, progress: int, message: str, result: dict[str, Any] | None = None) -> bool:
    """Store the current status of the ML training pipeline."""
    client = _get_client()
    if not client:
        return False
    try:
        data = {
            "status": status,
            "progress": progress,
            "message": message,
        }
        if result is not None:
            data["result"] = result
            
        client.setex("ml:training:status", 3600, json.dumps(data)) # Expire after 1 hour
        return True
    except Exception:
        return False


def get_training_progress() -> dict[str, Any]:
    """Retrieve the current ML training pipeline status."""
    client = _get_client()
    default_state = {"status": "idle", "progress": 0, "message": "Ready"}
    if not client:
        return default_state
    try:
        data = client.get("ml:training:status")
        return json.loads(data) if data else default_state
    except Exception:
        return default_state
