"""
Load trained models and feature columns for prediction.
"""
from pathlib import Path
from typing import Any

import joblib


def load_model_artifacts(models_dir: Path) -> tuple[Any, list[str], str | None]:
    """
    Load model, feature columns, and model name from models/.
    Returns (model, feature_cols, model_name) or raises FileNotFoundError.
    """
    models_dir = Path(models_dir)
    model_path = models_dir / "trained_model.pkl"
    features_path = models_dir / "feature_columns.pkl"
    name_path = models_dir / "model_name.pkl"

    if not model_path.exists():
        raise FileNotFoundError(f"No trained model at {model_path}. Run POST /train first.")

    model = joblib.load(model_path)
    feature_cols = joblib.load(features_path) if features_path.exists() else []
    model_name = joblib.load(name_path) if name_path.exists() else None

    return model, feature_cols, model_name


def list_available_models(models_dir: Path) -> list[dict]:
    """List available models (trained_model.pkl + metadata)."""
    models_dir = Path(models_dir)
    if not (models_dir / "trained_model.pkl").exists():
        return []
    try:
        _, feature_cols, model_name = load_model_artifacts(models_dir)
        return [{
            "id": "default",
            "name": model_name or "trained_model",
            "feature_count": len(feature_cols),
            "active": True,
        }]
    except Exception:
        return []
