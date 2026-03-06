import json
import logging
from typing import Dict, Any
# Using a simple stub since confluent-kafka might require C extensions not present
# in default windows/mac environments easily, we'll try kafka-python.
from kafka import KafkaProducer
from kafka.errors import KafkaError

logger = logging.getLogger("ml_server.kafka")

class PredictionEventProducer:
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.bootstrap_servers = bootstrap_servers
        self.topic = "prediction_events"
        self.producer = None
        self.connect()

    def connect(self):
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=[self.bootstrap_servers],
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                # Add retries for robustness
                retries=3
            )
            logger.info(f"Connected to Kafka broker at {self.bootstrap_servers}")
        except Exception as e:
            logger.warning(f"Could not connect to Kafka at {self.bootstrap_servers}. Events will not be sent. Error: {e}")
            self.producer = None

    def send_event(self, event_data: Dict[str, Any]):
        if not self.producer:
            logger.warning("Kafka producer not connected. Dropping event.")
            return

        try:
            # Send message asynchronously
            future = self.producer.send(self.topic, value=event_data)
            # You can add callbacks to future.add_callback() if you want guarantee tracing
            logger.info(f"Sent prediction event to topic {self.topic}")
        except KafkaError as e:
            logger.error(f"Failed to send Kafka event: {e}")

producer_instance = PredictionEventProducer()
