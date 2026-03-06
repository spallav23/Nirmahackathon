"""
Training pipeline for Solar Inverter Failure Prediction (7-10 day window).
Extracted from train.ipynb - supports XGBoost, LightGBM, RandomForest.
"""
import warnings
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score, roc_auc_score
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

TARGET_COL = "future_failure_7_10_days"
RANDOM_STATE = 42


def load_dataset(path: Path) -> pd.DataFrame:
    ext = path.suffix.lower()
    if ext in (".xlsx", ".xls"):
        return pd.read_excel(path, engine="openpyxl")
    if ext == ".csv":
        return pd.read_csv(path, low_memory=False)
    raise ValueError(f"Unsupported file type: {ext}")


def preprocess_datetime(df: pd.DataFrame) -> pd.DataFrame:
    dt_candidates = [
        c for c in df.columns
        if any(k in c.lower() for k in ("datetime", "timestamp", "date", "time"))
    ]
    if not dt_candidates:
        raise ValueError("No datetime-like column found.")
    dt_col = dt_candidates[0]
    df[dt_col] = pd.to_datetime(df[dt_col])
    df.rename(columns={dt_col: "datetime"}, inplace=True)
    id_candidates = [
        c for c in df.columns
        if any(k in c.lower() for k in ("inverter_id", "plant_id", "device_id"))
    ]
    if id_candidates:
        df.rename(columns={id_candidates[0]: "inverter_id"}, inplace=True)
    else:
        df["inverter_id"] = "INV_1"
    df.sort_values(["inverter_id", "datetime"], inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def create_future_target(df: pd.DataFrame) -> pd.DataFrame:
    failure_col = None
    for c in df.columns:
        if "failure" in c.lower() or "fault" in c.lower():
            failure_col = c
            break
    if failure_col is None:
        raise ValueError("Failure column not found")
    df[failure_col] = df[failure_col].fillna(0)
    df[TARGET_COL] = df.groupby("inverter_id")[failure_col].shift(-48)
    df[TARGET_COL] = df[TARGET_COL].fillna(0).astype(int)
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.drop_duplicates()
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    sensor_cols = [
        c for c in df.select_dtypes(include=[np.number]).columns
        if c != TARGET_COL
    ]
    for col in sensor_cols:
        df[f"{col}_rolling_mean"] = (
            df.groupby("inverter_id")[col]
            .rolling(24, min_periods=1)
            .mean()
            .reset_index(level=0, drop=True)
        )
        df[f"{col}_diff"] = df.groupby("inverter_id")[col].diff().fillna(0)
    return df


def select_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    drop_cols = {"datetime", "inverter_id", TARGET_COL}
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    feature_cols = [c for c in numeric_cols if c not in drop_cols]
    X = df[feature_cols]
    y = df[TARGET_COL]
    return X, y, feature_cols


def time_split(X: pd.DataFrame, y: pd.Series, train_ratio: float = 0.8) -> tuple:
    split = int(len(X) * train_ratio)
    return X.iloc[:split], X.iloc[split:], y.iloc[:split], y.iloc[split:]


def build_models() -> dict[str, Any]:
    return {
        "RandomForest": RandomForestClassifier(
            n_estimators=100, max_depth=8, min_samples_leaf=10,
            n_jobs=-1, random_state=RANDOM_STATE
        ),
        "XGBoost": XGBClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.05,
            subsample=0.7, colsample_bytree=0.6, eval_metric="logloss",
            random_state=RANDOM_STATE
        ),
        "LightGBM": LGBMClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.05,
            num_leaves=31, random_state=RANDOM_STATE, verbose=-1
        ),
    }


def train_all_models(
    models: dict, X_train: pd.DataFrame, y_train: pd.Series
) -> dict[str, Any]:
    fitted = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        fitted[name] = model
    return fitted


def evaluate_models(
    models: dict, X_test: pd.DataFrame, y_test: pd.Series
) -> tuple[pd.DataFrame, str]:
    results = []
    for name, model in models.items():
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        f1 = f1_score(y_test, y_pred, zero_division=0)
        try:
            auc = roc_auc_score(y_test, y_prob)
        except ValueError:
            auc = 0.0
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        results.append({"Model": name, "precision": prec, "recall": rec, "F1": f1, "AUC": auc})
    df_metrics = pd.DataFrame(results)
    best_name = df_metrics.sort_values("F1", ascending=False).iloc[0]["Model"]
    return df_metrics, best_name


def explain_with_shap(model: Any, X: pd.DataFrame, plots_dir: Path) -> None:
    sample = X.sample(min(500, len(X)), random_state=RANDOM_STATE)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(sample)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    shap.summary_plot(shap_values, sample, show=False)
    plots_dir.mkdir(parents=True, exist_ok=True)
    plt.savefig(plots_dir / "shap_summary.png")
    plt.close()


def run_training(
    dataset_path: Path,
    models_dir: Path,
    plots_dir: Path | None = None,
) -> dict:
    """Run full training pipeline. Returns metrics and best model name."""
    models_dir = Path(models_dir)
    plots_dir = Path(plots_dir) if plots_dir else models_dir.parent / "plots"

    df = load_dataset(dataset_path)
    df = preprocess_datetime(df)
    df = create_future_target(df)
    df = clean_data(df)
    df = engineer_features(df)

    X, y, feature_cols = select_features(df)
    X_train, X_test, y_train, y_test = time_split(X, y)

    models = build_models()
    fitted = train_all_models(models, X_train, y_train)
    metrics_df, best_name = evaluate_models(fitted, X_test, y_test)
    best_model = fitted[best_name]

    try:
        explain_with_shap(best_model, X_test, plots_dir)
    except Exception:
        pass

    models_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, models_dir / "trained_model.pkl")
    joblib.dump(feature_cols, models_dir / "feature_columns.pkl")
    joblib.dump(best_name, models_dir / "model_name.pkl")

    return {
        "metrics": metrics_df.to_dict(orient="records"),
        "best_model": best_name,
        "feature_count": len(feature_cols),
    }
