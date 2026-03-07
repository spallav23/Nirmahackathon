"""
ML Prediction Server - AI-Driven Solar Inverter Failure Prediction.
Endpoints: POST /predict, POST /train, GET /models, GET /health.
Integrates Redis feature store, Kafka events, SHAP explainability.
"""
import json
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model_loader import load_model_artifacts, list_available_models
from redis_store import get_features, set_features, set_training_progress, get_training_progress
from train_runner import run_training

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DEFAULT_DATASET = BASE_DIR / "solar_ml_master_dataset.xlsx"

KAFKA_BROKERS = os.environ.get("KAFKA_BROKERS", "localhost:9092").strip()
KAFKA_TOPIC_PREDICTIONS = os.environ.get("KAFKA_TOPIC_PREDICTIONS", "prediction_events")
KAFKA_TOPIC_TRAINING = os.environ.get("KAFKA_TOPIC_TRAINING", "model_training_events")

MODELS_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# Kafka producer (lazy init)
# -----------------------------------------------------------------------------
_producer = None


def _get_kafka_producer():
    global _producer
    if _producer is not None:
        return _producer
    try:
        from kafka import KafkaProducer
        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BROKERS.split(","),
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
    except Exception as e:
        print("Kafka producer init failed:", e)
    return _producer


def _publish_prediction(payload: dict) -> bool:
    prod = _get_kafka_producer()
    if not prod:
        return False
    try:
        prod.send(KAFKA_TOPIC_PREDICTIONS, value=payload)
        prod.flush(timeout=5)
        return True
    except Exception as e:
        print("Kafka prediction publish failed:", e)
        return False


def _publish_training_event(payload: dict) -> bool:
    prod = _get_kafka_producer()
    if not prod:
        return False
    try:
        prod.send(KAFKA_TOPIC_TRAINING, value=payload)
        prod.flush(timeout=5)
        return True
    except Exception as e:
        print("Kafka training event publish failed:", e)
        return False


# -----------------------------------------------------------------------------
# SHAP top feature contributions
# -----------------------------------------------------------------------------
def _compute_shap_top_features(model: Any, X: pd.DataFrame, feature_cols: list[str], top_k: int = 5) -> list[dict]:
    """Compute top-K feature contributions using SHAP."""
    try:
        import shap
        sample = X if len(X) <= 1 else X.iloc[:1]
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(sample)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        vals = shap_values[0] if len(shap_values.shape) > 1 else shap_values
        contrib = [(feature_cols[i], float(vals[i])) for i in range(len(feature_cols))]
        contrib.sort(key=lambda x: abs(x[1]), reverse=True)
        return [
            # Keep both fields for compatibility across UI/analytics.
            {"name": n, "value": round(c, 4), "contribution": round(c, 4)}
            for n, c in contrib[:top_k]
        ]
    except Exception as e:
        print("SHAP computation failed:", e)
        return []


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(
    title="ML Prediction Server",
    description="Solar Inverter Failure Prediction (7-10 day window)",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])




# -----------------------------------------------------------------------------
# Request/Response models
# -----------------------------------------------------------------------------
class PredictRequest(BaseModel):
    inverter_id: str | None = Field(None, description="Inverter ID (fetch features from Redis)")
    inverterId: str | None = Field(None, alias="inverterId")
    user_id: str | None = Field(None, description="User ID for history")
    userId: str | None = Field(None, alias="userId")
    model_id: str | None = Field(None, alias="modelId", description="Model to use (default: active)")
    features: dict[str, float] | None = Field(None, description="Pre-computed features (overrides Redis)")
    telemetry: dict[str, float] | None = Field(
        None,
        description="Raw telemetry values (will be mapped into the model feature vector).",
    )

    class Config:
        populate_by_name = True


# -----------------------------------------------------------------------------
# JSON Cache helpers  (written by preprocess_dataset.py)
# -----------------------------------------------------------------------------
SUMMARY_JSON = BASE_DIR / "dataset_summary.json"
HISTORY_JSON = BASE_DIR / "inverter_history.json"
IDS_JSON     = BASE_DIR / "inverter_ids.json"

_json_summary:  list | None = None
_json_history:  dict | None = None
_json_ids:      list | None = None
_cache_building: bool = False  # True while background thread is processing xlsx


def _load_json_cache():
    """Load all precomputed JSON files into memory once."""
    global _json_summary, _json_history, _json_ids
    if _json_summary is None and SUMMARY_JSON.exists():
        with open(SUMMARY_JSON) as f:
            _json_summary = json.load(f)
        print(f"[cache] Loaded dataset_summary.json ({len(_json_summary)} records)")
    if _json_history is None and HISTORY_JSON.exists():
        with open(HISTORY_JSON) as f:
            _json_history = json.load(f)
        print(f"[cache] Loaded inverter_history.json ({len(_json_history)} inverters)")
    if _json_ids is None and IDS_JSON.exists():
        with open(IDS_JSON) as f:
            _json_ids = json.load(f)
        print(f"[cache] Loaded inverter_ids.json ({len(_json_ids)} IDs)")


# Load immediately if files already exist (e.g. second restart)
try:
    _load_json_cache()
except Exception as _e:
    print(f"[cache] Could not pre-load JSON cache: {_e}")


@app.on_event("startup")
async def startup_generate_json_cache():
    """
    On first startup, kick off JSON cache generation in a background daemon thread.
    The server starts accepting requests immediately (healthcheck passes right away).
    Dataset endpoints return a 'still initialising' message until cache is ready.
    On subsequent restarts the files already exist so this returns instantly.
    """
    global _cache_building

    if _json_summary is not None:
        print("[startup] JSON cache already in memory — ready.")
        return

    if SUMMARY_JSON.exists() and HISTORY_JSON.exists() and IDS_JSON.exists():
        _load_json_cache()
        print("[startup] JSON cache loaded from existing files.")
        return

    if not DEFAULT_DATASET.exists():
        print("[startup] Dataset file not found; skipping cache generation.")
        return

    import threading

    def _generate():
        global _cache_building
        _cache_building = True
        try:
            print("[startup] Building JSON dataset cache in background thread...")
            from train_runner import load_dataset, preprocess_datetime
            df = load_dataset(DEFAULT_DATASET)
            df = preprocess_datetime(df)

            # -- daily summary --
            tmp = df.copy()
            tmp["date"] = tmp["datetime"].dt.date
            agg = tmp.groupby("date").agg(
                total_power=("inverter_power", "sum"),
                total_energy=("energy_today", "sum"),
                reading_count=("datetime", "count"),
            ).reset_index()
            agg["date"] = agg["date"].astype(str)
            with open(SUMMARY_JSON, "w") as f:
                json.dump(agg.tail(60).to_dict(orient="records"), f)
            print(f"[startup]  ✓ dataset_summary.json ({len(agg)} days)")

            # -- inverter IDs --
            ids = sorted(df["inverter_id"].dropna().unique().astype(str).tolist())
            with open(IDS_JSON, "w") as f:
                json.dump(ids, f)
            print(f"[startup]  ✓ inverter_ids.json ({len(ids)} IDs)")

            # -- per-inverter history --
            history = {}
            for inv_id, grp in df.groupby("inverter_id"):
                g = grp.sort_values("datetime").tail(50).copy()
                g["datetime"] = g["datetime"].astype(str)
                g = g.where(pd.notnull(g), None)
                history[str(inv_id)] = g.to_dict(orient="records")
            with open(HISTORY_JSON, "w") as f:
                json.dump(history, f)
            print(f"[startup]  ✓ inverter_history.json ({len(history)} inverters)")

            _load_json_cache()
            print("[startup] ✓ JSON cache complete — dataset endpoints are now fully ready.")
        except Exception as exc:
            import traceback
            print(f"[startup] JSON cache generation failed: {exc}")
            traceback.print_exc()
        finally:
            _cache_building = False

    t = threading.Thread(target=_generate, daemon=True)
    t.start()
    print("[startup] Server is ready. Dataset cache building in background...")


# ---------------------------------------------------------------------------
# Legacy in-memory xlsx loader (fallback ONLY if JSON cache not yet available)
# ---------------------------------------------------------------------------
_cached_dataset = None

def _get_dataset() -> pd.DataFrame:
    global _cached_dataset
    if _cached_dataset is not None:
        return _cached_dataset
    if not DEFAULT_DATASET.exists():
        return pd.DataFrame()
    from train_runner import load_dataset, preprocess_datetime
    try:
        df = load_dataset(DEFAULT_DATASET)
        df = preprocess_datetime(df)
        _cached_dataset = df
        return df
    except Exception as e:
        print("Failed to load dataset:", e)
        return pd.DataFrame()


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    """Health check — always responds immediately regardless of cache state."""
    return {"status": "ok", "cache_ready": _json_summary is not None and _json_ids is not None}

@app.get("/dataset/summary")
def get_dataset_summary():
    """Serve daily aggregated stats from JSON cache."""
    if _json_summary is not None:
        return {"success": True, "data": _json_summary}
    if _cache_building:
        return {"success": False, "message": "Dataset cache is still being built. Please try again in a minute.", "building": True}
    # Try loading files (may have appeared since startup)
    _load_json_cache()
    if _json_summary is not None:
        return {"success": True, "data": _json_summary}
    return {"success": False, "message": "Dataset not available. Ensure solar_ml_master_dataset.xlsx is present and restart."}


@app.get("/dataset/inverters")
def get_unique_inverters():
    """Return sorted inverter ID list from JSON cache."""
    if _json_ids is not None:
        return {"success": True, "data": _json_ids}
    if _cache_building:
        return {"success": False, "message": "Dataset cache is still being built. Please try again in a minute.", "building": True}
    _load_json_cache()
    if _json_ids is not None:
        return {"success": True, "data": _json_ids}
    return {"success": False, "message": "Dataset not available. Ensure solar_ml_master_dataset.xlsx is present and restart."}


@app.get("/dataset/inverters/{inverter_id}")
def get_dataset_inverter_history(inverter_id: str, limit: int = 50):
    """Retrieve per-inverter history from JSON cache."""
    if _json_history is not None:
        records = _json_history.get(str(inverter_id))
        if records is None:
            return {"success": False, "message": f"Inverter '{inverter_id}' not found in dataset"}
        return {"success": True, "data": records[-limit:]}
    if _cache_building:
        return {"success": False, "message": "Dataset cache is still being built. Please try again in a minute.", "building": True}
    _load_json_cache()
    if _json_history is not None:
        records = _json_history.get(str(inverter_id))
        if records is None:
            return {"success": False, "message": f"Inverter '{inverter_id}' not found in dataset"}
        return {"success": True, "data": records[-limit:]}
    return {"success": False, "message": "Dataset not available. Ensure solar_ml_master_dataset.xlsx is present and restart."}

    # Fallback: xlsx
    df = _get_dataset()
    if df.empty:
        return {"success": False, "message": "Dataset not available. Run preprocess_dataset.py first."}
    inv_df = df[df["inverter_id"] == inverter_id].copy()
    if inv_df.empty:
        return {"success": False, "message": "Inverter not found in dataset"}
    inv_df = inv_df.sort_values("datetime").tail(limit)
    inv_df["datetime"] = inv_df["datetime"].astype(str)
    return {"success": True, "data": inv_df.to_dict(orient="records")}


@app.get("/models")
def get_models() -> dict:
    """List available models. Users can select which model to use."""
    models = list_available_models(MODELS_DIR)
    return {"success": True, "data": {"models": models}}

@app.get("/models/active")
def get_active_model() -> dict:
    """Return the currently active model."""
    try:
        _, feature_cols, model_name = load_model_artifacts(MODELS_DIR)
        return {"success": True, "data": {"activeModel": model_name, "feature_count": len(feature_cols)}}
    except FileNotFoundError:
        return {"success": True, "data": {"activeModel": None, "feature_count": 0}}


class ChangeModelRequest(BaseModel):
    model_id: str = Field(..., description="ID of the model to activate (e.g. 'xgboost')")

@app.post("/models/active")
def set_active_model(req: ChangeModelRequest):
    """Switch the actively used predictive model."""
    import shutil
    import joblib
    
    model_id = req.model_id.lower()
    source_model = MODELS_DIR / f"{model_id}.pkl"
    
    if not source_model.exists():
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found on disk.")
        
    # Copy the selected model to be the default 'trained_model.pkl'
    shutil.copy(source_model, MODELS_DIR / "trained_model.pkl")
    
    name_display = model_id.title()
    if model_id == "xgboost": name_display = "XGBoost"
    elif model_id == "lightgbm": name_display = "LightGBM"
    elif model_id == "randomforest": name_display = "RandomForest"
    
    joblib.dump(name_display, MODELS_DIR / "model_name.pkl")
    
    return {"success": True, "message": f"Active model changed to {name_display}"}


@app.post("/predict")
def predict(req: PredictRequest):
    """
    Run prediction. Provide either:
    - inverter_id: fetch features from Redis
    - features: dict of feature_name -> value
    """
    inverter_id = req.inverter_id or req.inverterId or "INV-UNKNOWN"
    user_id = req.user_id or req.userId

    # Load model
    try:
        model_id = (req.model_id or "").strip() or None
        model, feature_cols, model_name = load_model_artifacts(MODELS_DIR, model_id=model_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Resolve features
    features = req.features
    if features is None:
        if req.telemetry:
            tel = {k: float(v) for k, v in req.telemetry.items() if v is not None}
            voltage = tel.get("voltage") or tel.get("Voltage") or tel.get("ac_voltage")
            current = tel.get("current") or tel.get("Current") or tel.get("ac_current")
            if voltage is not None and current is not None:
                tel.setdefault("power", float(voltage) * float(current))
            temperature = tel.get("temperature") or tel.get("Temperature")
            if temperature is not None:
                tel.setdefault("temperature_avg", float(temperature))
            features = tel
        else:
            features = get_features(inverter_id)
            print(features)
            if features is None:
                raise HTTPException(
                    status_code=400,
                    detail="No features/telemetry provided and none found in Redis for inverter_id. Send 'features' or 'telemetry', or populate Redis first.",
                )

    # Build feature vector (fill missing with 0)
    row = {c: float(features.get(c, 0)) for c in feature_cols}
    X = pd.DataFrame([row])[feature_cols]

    # Predict
    risk_score = float(model.predict_proba(X)[0, 1])
    risk_pct = round(risk_score * 100, 2)

    # SHAP explainability
    top_features = _compute_shap_top_features(model, X, feature_cols, top_k=5)

    model_output = {"risk_score": risk_score, "inverter_id": inverter_id, "model": model_name or "unknown"}
    request_id = str(uuid.uuid4())

    payload = {
        "requestId": request_id,
        "inverterId": inverter_id,
        "riskScore": risk_pct,
        "modelOutput": model_output,
        "topFeatures": top_features,
        "userId": user_id,
    }
    _publish_prediction(payload)

    # Optionally store in Redis for future use
    set_features(inverter_id, features)

    return {
        "request_id": request_id,
        "risk_score": risk_pct,
        "inverter_id": inverter_id,
        "top_features": top_features,
        "model_output": model_output,
        "message": "7-10 day failure risk prediction with SHAP explainability.",
    }


@app.get("/train/progress")
def get_train_progress() -> dict:
    """Return the current ML training pipeline status."""
    return {"success": True, "data": get_training_progress()}


def _run_training_background(dataset_path: Path, model_type: str | None, is_temp_file: bool):
    """Background task to execute training pipeline and emit events."""
    try:
        def progress_tracker(progress: int, message: str):
            set_training_progress("running", progress, message)
            
        result = run_training(
            dataset_path=dataset_path,
            models_dir=MODELS_DIR,
            plots_dir=MODELS_DIR.parent / "plots",
            model_type=model_type,
            progress_callback=progress_tracker
        )
        
        event = {
            "event": "model_trained",
            "best_model": result.get("best_model"),
            "feature_count": result.get("feature_count"),
            "metrics": result.get("metrics", []),
        }
        _publish_training_event(event)

        # Signal completion with the result data
        set_training_progress("completed", 100, f"Training complete! Best model: {result.get('best_model')}", result=result)

    except Exception as e:
        print(f"Background training failed: {e}")
        set_training_progress("error", 0, f"Training failed: {e}")
    finally:
        if is_temp_file and dataset_path.exists():
            try:
                dataset_path.unlink()
            except Exception:
                pass


@app.post("/train")
async def train(
    background_tasks: BackgroundTasks,
    model_type: str | None = Query(None, description="XGBoost | LightGBM | RandomForest"),
    file: UploadFile | None = File(None),
):
    """
    Upload dataset and retrain. Uses solar_ml_master_dataset.xlsx if no file provided.
    Trains XGBoost, LightGBM, RandomForest; picks best by F1; saves model; publishes to model_training_events.
    """
    dataset_path = DEFAULT_DATASET
    if file and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in (".xlsx", ".xls", ".csv"):
            raise HTTPException(status_code=400, detail="Unsupported file type. Use .xlsx, .xls, or .csv")
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(await file.read())
            dataset_path = Path(tmp.name)
    elif not DEFAULT_DATASET.exists():
        raise HTTPException(
            status_code=400,
            detail="No dataset file provided and solar_ml_master_dataset.xlsx not found. Upload a file.",
        )

    try:
        # Immediately set status to Started
        set_training_progress("running", 0, "Initiating training pipeline...")
        background_tasks.add_task(
            _run_training_background,
            dataset_path=dataset_path,
            model_type=model_type,
            is_temp_file=(dataset_path != DEFAULT_DATASET),
        )
        return {
            "success": True, 
            "message": "Training started in the background. Poll /train/progress for status.",
            "data": {"status": "started"}
        }
    except Exception as e:
        set_training_progress("error", 0, str(e))
        raise HTTPException(status_code=500, detail=f"Failed to initiate training: {e}")
