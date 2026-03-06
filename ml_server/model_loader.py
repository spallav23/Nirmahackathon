"""
Load trained models and feature columns for prediction.
"""
from pathlib import Path
from typing import Any

import joblib


def load_model_artifacts(models_dir: Path, model_id: str | None = None) -> tuple[Any, list[str], str | None]:
    """
    Load model, feature columns, and model name from models/.
    Returns (model, feature_cols, model_name) or raises FileNotFoundError.
    """
    models_dir = Path(models_dir)
    if model_id:
        model_path = models_dir / f"{model_id.lower()}.pkl"
    else:
        model_path = models_dir / "trained_model.pkl"
    features_path = models_dir / "feature_columns.pkl"
    name_path = models_dir / "model_name.pkl"

    if not model_path.exists():
        raise FileNotFoundError(f"No trained model at {model_path}. Run POST /train first or choose an available model_id.")

    model = joblib.load(model_path)
    feature_cols = joblib.load(features_path) if features_path.exists() else []
    if model_id:
        # Prefer a friendly name for explicit model selection.
        mid = model_id.lower()
        if mid == "xgboost":
            model_name = "XGBoost"
        elif mid == "lightgbm":
            model_name = "LightGBM"
        elif mid == "randomforest":
            model_name = "RandomForest"
        else:
            model_name = model_id
    else:
        model_name = joblib.load(name_path) if name_path.exists() else None

    return model, feature_cols, model_name


def list_available_models(models_dir: Path) -> list[dict]:
    """List available models (trained_model.pkl + metadata)."""
    models_dir = Path(models_dir)
    if not (models_dir / "trained_model.pkl").exists():
        return []
    try:
        _, feature_cols, active_name = load_model_artifacts(models_dir)
        
        models = []
        
        # Load associated metrics if they exist
        metrics_map = {}
        metrics_path = models_dir / "model_metrics.pkl"
        if metrics_path.exists():
            try:
                metrics_list = joblib.load(metrics_path)
                # metrics_list is expected to be [{"Model": "XGBoost", "F1": 0.9, ...}]
                for m in metrics_list:
                    metrics_map[m.get("Model", "").lower()] = m
            except Exception as e:
                print("Failed tracking metrics:", e)

        for p in models_dir.glob("*.pkl"):
            if p.name in ("trained_model.pkl", "feature_columns.pkl", "model_name.pkl", "model_metrics.pkl"):
                continue
            model_id = p.stem.lower() # e.g. xgboost
            name_display = model_id.title()
            
            # Use original casing if we can infer it
            if model_id == "xgboost": name_display = "XGBoost"
            elif model_id == "lightgbm": name_display = "LightGBM"
            elif model_id == "randomforest": name_display = "RandomForest"
            
            is_active = (active_name == name_display)
            metrics = metrics_map.get(model_id, {})
            
            models.append({
                "id": model_id,
                "name": name_display,
                "feature_count": len(feature_cols),
                "active": is_active,
                "metrics": {
                    "f1": round(metrics.get("F1", 0.0), 3),
                    "precision": round(metrics.get("precision", 0.0), 3),
                    "recall": round(metrics.get("recall", 0.0), 3),
                    "auc": round(metrics.get("AUC", 0.0), 3)
                } if metrics else None
            })
        
        # If no extra models found (backward compat), return just the active one
        if not models:
            return [{
                "id": active_name.lower() if active_name else "default",
                "name": active_name or "trained_model",
                "feature_count": len(feature_cols),
                "active": True,
            }]
            
        return models
    except Exception:
        return []
