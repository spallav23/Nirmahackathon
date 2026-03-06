"""
Unit tests for ML Prediction Server - core API functionality and prediction pipeline.
"""
from pathlib import Path

import joblib
import pytest
from fastapi.testclient import TestClient
from sklearn.datasets import make_classification
from sklearn.dummy import DummyClassifier

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from main import app

client = TestClient(app)


def test_health():
    """GET /health returns status ok."""
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_models_empty():
    """GET /models returns empty list when no model trained."""
    r = client.get("/models")
    assert r.status_code == 200
    data = r.json()
    assert "data" in data
    assert "models" in data["data"]
    assert isinstance(data["data"]["models"], list)


def test_predict_no_model():
    """POST /predict returns 503 when no model is trained."""
    r = client.post("/predict", json={"inverterId": "INV-1", "features": {"x": 1.0}})
    assert r.status_code == 503
    assert "No trained model" in r.json()["detail"] or "Run POST /train" in r.json()["detail"]


def test_predict_with_mock_model(monkeypatch, tmp_path):
    """POST /predict returns risk score and top_features when model exists."""
    X, y = make_classification(n_samples=100, n_features=5, random_state=42)
    model = DummyClassifier(strategy="uniform").fit(X, y)
    feature_cols = [f"f{i}" for i in range(5)]

    joblib.dump(model, tmp_path / "trained_model.pkl")
    joblib.dump(feature_cols, tmp_path / "feature_columns.pkl")
    joblib.dump("Dummy", tmp_path / "model_name.pkl")

    from main import MODELS_DIR
    monkeypatch.setattr("main.MODELS_DIR", tmp_path)

    features = {f"f{i}": float(X[0, i]) for i in range(5)}
    r = client.post("/predict", json={"inverterId": "INV-TEST", "features": features})
    assert r.status_code == 200
    data = r.json()
    assert "risk_score" in data
    assert "top_features" in data
    assert "inverter_id" in data
    assert data["inverter_id"] == "INV-TEST"
    assert 0 <= data["risk_score"] <= 100
