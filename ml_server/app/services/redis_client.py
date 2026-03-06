import json
import os
import logging
import random
import redis
from typing import Dict, Any, Optional

logger = logging.getLogger("ml_server.redis")

class RedisFeatureStore:
    def __init__(self, port: int = 6379, db: int = 0):
        self.host = os.environ.get("REDIS_HOST", "localhost")
        self.port = int(os.environ.get("REDIS_PORT", port))
        self.db = db
        self.client = None
        self.connect()

    def connect(self):
        try:
            self.client = redis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=True)
            # Test connection
            self.client.ping()
            logger.info("Successfully connected to Redis Feature Store.")
        except redis.ConnectionError:
            logger.warning(f"Could not connect to Redis at {self.host}:{self.port}. Live data fetching will fallback to mocked data.")
            self.client = None

    def get_live_telemetry(self, inverter_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches the latest aggregated features for the given inverter from Redis.
        If Redis is unreachable, returns mocked plausible data for demonstration.
        """
        if self.client:
            try:
                # Assuming features are stored as a JSON string under keys like 'features:INV-A1'
                raw_data = self.client.get(f"features:{inverter_id}")
                if raw_data:
                    return json.loads(raw_data)
            except Exception as e:
                logger.error(f"Error fetching from Redis: {e}")

        # Fallback Mock Data Generation if Redis isn't up locally during testing
        logger.info(f"Generating mock live telemetry for {inverter_id} (Redis unavailable or key missing).")
        return {
            "inverter_id": inverter_id,
            "temperature_avg": round(random.uniform(35.0, 85.0), 2),
            "voltage_variance": round(random.uniform(2.0, 15.0), 2),
            "current_deviation": round(random.uniform(0.1, 5.0), 2),
            "power_ratio": round(random.uniform(80.0, 99.0), 2),
            "alarm_frequency": random.randint(0, 5)
        }

feature_store = RedisFeatureStore()
