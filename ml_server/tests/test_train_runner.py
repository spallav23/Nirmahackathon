"""
Unit tests for training pipeline - feature engineering, model evaluation.
"""
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from train_runner import (
    build_models,
    clean_data,
    create_future_target,
    engineer_features,
    evaluate_models,
    load_dataset,
    preprocess_datetime,
    select_features,
    time_split,
)


def test_build_models():
    """build_models returns XGBoost, LightGBM, RandomForest."""
    models = build_models()
    assert set(models.keys()) == {"RandomForest", "XGBoost", "LightGBM"}
    for m in models.values():
        assert hasattr(m, "fit") and hasattr(m, "predict_proba")


def test_time_split():
    """time_split returns correct train/test sizes."""
    X = pd.DataFrame(np.random.randn(100, 5), columns=[f"f{i}" for i in range(5)])
    y = pd.Series(np.random.randint(0, 2, 100))
    X_train, X_test, y_train, y_test = time_split(X, y, train_ratio=0.8)
    assert len(X_train) == 80 and len(X_test) == 20
    assert len(y_train) == 80 and len(y_test) == 20


def test_evaluate_models():
    """evaluate_models returns precision, recall, F1, AUC."""
    X = pd.DataFrame(np.random.randn(200, 5), columns=[f"f{i}" for i in range(5)])
    y = pd.Series(np.random.randint(0, 2, 200))
    models = build_models()
    fitted = {n: m.fit(X, y) for n, m in models.items()}
    metrics_df, best = evaluate_models(fitted, X, y)
    assert "precision" in metrics_df.columns
    assert "recall" in metrics_df.columns
    assert "F1" in metrics_df.columns
    assert "AUC" in metrics_df.columns
    assert best in models
