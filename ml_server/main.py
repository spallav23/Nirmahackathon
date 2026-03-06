"""
Temporary ML server: returns random risk score on POST /predict and publishes to Kafka.
Remove when replacing with real ML service.
"""
import json
import os
import random

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Kafka producer (lazy init)
_producer = None

def get_producer():
    global _producer
    if _producer is not None:
        return _producer
    brokers = os.environ.get("KAFKA_BROKERS", "localhost:9092").strip()
    topic = os.environ.get("KAFKA_TOPIC_PREDICTIONS", "prediction_events")
    try:
        from kafka import KafkaProducer
        _producer = KafkaProducer(
            bootstrap_servers=brokers.split(","),
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        _producer._temp_topic = topic
    except Exception as e:
        print("Kafka producer init failed:", e)
    return _producer


app = FastAPI(title="Temp ML Server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(request: dict = None):
    request = request or {}
    inverter_id = (request.get("inverterId") or request.get("inverter_id") or "INV-TEMP-001")
    if isinstance(inverter_id, str):
        inverter_id = inverter_id.strip() or "INV-TEMP-001"
    user_id = request.get("userId") or request.get("user_id")

    risk_score = round(random.uniform(10, 95), 2)
    top_features = [
        {"name": "temperature_avg", "value": round(random.uniform(35, 75), 2), "contribution": round(random.uniform(0.1, 0.4), 2)},
        {"name": "voltage_variance", "value": round(random.uniform(0.5, 2.5), 2), "contribution": round(random.uniform(0.05, 0.3), 2)},
        {"name": "power_ratio", "value": round(random.uniform(0.6, 1.0), 2), "contribution": round(random.uniform(0.05, 0.25), 2)},
    ]
    model_output = {"risk_score": risk_score, "inverter_id": inverter_id}

    payload = {
        "inverterId": inverter_id,
        "riskScore": risk_score,
        "modelOutput": model_output,
        "topFeatures": top_features,
        "userId": user_id,
    }
    prod = get_producer()
    if prod and getattr(prod, "_temp_topic", None):
        try:
            prod.send(prod._temp_topic, value=payload)
            prod.flush(timeout=5)
        except Exception as e:
            print("Kafka send failed:", e)

    return {
        "risk_score": risk_score,
        "inverter_id": inverter_id,
        "top_features": top_features,
        "message": "Temp random score; event sent to Kafka.",
    }
