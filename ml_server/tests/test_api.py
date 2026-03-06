import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_list_models():
    response = client.get("/models")
    assert response.status_code == 200
    body = response.json()
    assert "available_models" in body
    assert "dummy_v1" in body["available_models"]

def test_predict_success():
    payload = {
        "model_id": "dummy_v1",
        "telemetry": {
            "inverter_id": "INV-TEST-01",
            "temperature_avg": 45.0,
            "voltage_variance": 5.0,
            "current_deviation": 1.2,
            "power_ratio": 95.0,
            "alarm_frequency": 0
        }
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "top_features" in data
    assert len(data["top_features"]) <= 3
    assert data["inverter_id"] == "INV-TEST-01"

def test_predict_invalid_model():
    payload = {
        "model_id": "non_existent_model_v99",
        "telemetry": {
            "inverter_id": "INV-TEST-01",
            "temperature_avg": 45.0,
            "voltage_variance": 5.0,
            "current_deviation": 1.2,
            "power_ratio": 95.0,
            "alarm_frequency": 0
        }
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 400
    assert "not loaded" in response.json()["detail"]
