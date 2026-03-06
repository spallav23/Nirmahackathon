import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_parameter_update():
    # Update dummy_v1
    payload = {
        "base_risk_adjustment": 0.5,
        "temperature_threshold": 60.0,
        "voltage_threshold": 5.0,
        "alarm_threshold": 1
    }
    response = client.put("/models/dummy_v1/parameters", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Try updating a non-existent model
    response = client.put("/models/invalid_model/parameters", json=payload)
    assert response.status_code == 404

def test_trigger_retraining():
    response = client.post("/train")
    assert response.status_code == 200
    assert response.json()["status"] == "queued"
    assert "job_id" in response.json()

def test_predict_with_redis_fetch(mocker):
    # Mock the redis client to return a static payload so we don't need Redis running
    mock_payload = {
        "inverter_id": "INV-MOCK",
        "temperature_avg": 80.0,
        "voltage_variance": 12.0,
        "current_deviation": 1.5,
        "power_ratio": 85.0,
        "alarm_frequency": 3
    }
    mocker.patch('app.services.redis_client.RedisFeatureStore.get_live_telemetry', return_value=mock_payload)
    
    # Notice we don't pass `telemetry` in the request, just `inverter_id`
    request_payload = {
        "model_id": "dummy_v1",
        "inverter_id": "INV-MOCK"
    }
    
    response = client.post("/predict", json=request_payload)
    assert response.status_code == 200
    assert response.json()["inverter_id"] == "INV-MOCK"
    assert "risk_score" in response.json()
