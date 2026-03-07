# ML Server

Python + FastAPI ML prediction server. Handles **failure risk prediction** (7–10 day window), **model training**, **model management**, and **SHAP explainability**. Integrates with Redis (feature store + training status) and Kafka (prediction + training events).

## Project Structure

```
ml_server/
├── main.py             # FastAPI app — all endpoints
├── model_loader.py     # Load trained models and feature columns from disk
├── redis_store.py      # Redis feature store + training progress tracker
├── train_runner.py     # Full ML training pipeline (XGBoost, LightGBM, RandomForest)
├── train.ipynb         # Exploratory notebook (development reference)
├── requirements.txt    # Python dependencies
├── Dockerfile
└── readme.md
```

## APIs

Base path when running via gateway: `/ml` (e.g. `POST /ml/predict`).
Direct base URL: `http://localhost:8000`.

### Prediction

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Run failure risk prediction for an inverter |

**Request body:**

```json
{
  "inverterId": "INV-001",
  "userId": "user-123",
  "modelId": "xgboost",
  "features": { "temperature_avg": 72.5, "voltage_variance": 0.12 },
  "telemetry": { "voltage": 230, "current": 5.2, "temperature": 74 }
}
```

- `inverterId` – used to look up features from Redis if no `features`/`telemetry` provided.
- `modelId` – optional; if omitted, uses the currently active model.
- `features` – pre-computed feature dict (overrides Redis lookup).
- `telemetry` – raw sensor values; server maps them into the feature vector (computes `power = voltage × current`).
- Missing feature columns are zero-filled at prediction time.

**Response:**

```json
{
  "request_id": "uuid",
  "risk_score": 83.47,
  "inverter_id": "INV-001",
  "top_features": [
    { "name": "temperature_avg_rolling_mean", "value": 0.312, "contribution": 0.312 }
  ],
  "model_output": { "risk_score": 0.8347, "inverter_id": "INV-001", "model": "XGBoost" },
  "message": "7-10 day failure risk prediction with SHAP explainability."
}
```

After each prediction, an event is published to Kafka topic `prediction_events` and the resolved features are cached back to Redis (24 h TTL).

---

### Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/models` | List all available trained models with metrics |
| GET | `/models/active` | Get the currently active model name and feature count |
| POST | `/models/active` | Switch the active model (hot-swap) |

**Switch active model:**

```json
POST /models/active
{ "model_id": "lightgbm" }
```

Copies `lightgbm.pkl` to `trained_model.pkl` so all subsequent predictions use it immediately. Supported values: `xgboost`, `lightgbm`, `randomforest`.

**List models response:**

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "xgboost",
        "name": "XGBoost",
        "feature_count": 48,
        "active": true,
        "metrics": { "f1": 0.912, "precision": 0.934, "recall": 0.891, "auc": 0.967 }
      }
    ]
  }
}
```

---

### Training

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/train` | Upload a dataset and trigger retraining in the background |
| GET | `/train/progress` | Poll live training pipeline progress |

**Trigger training — with new dataset:**

```
POST /train?model_type=XGBoost
Content-Type: multipart/form-data
file: <your_dataset.csv or .xlsx>
```

**Trigger training — on existing master dataset:**

```
POST /train
(no file body)
```

`model_type` query param is optional. If omitted, all three models (XGBoost, LightGBM, RandomForest) are trained concurrently and the best by F1 Score is selected automatically.

**Poll progress:**

```json
GET /train/progress

{
  "success": true,
  "data": {
    "status": "running",
    "progress": 65,
    "message": "Training XGBoost..."
  }
}
```

Status values: `idle` → `running` → `completed` | `error`.

Training result (on completion):

```json
{
  "status": "completed",
  "progress": 100,
  "message": "Training complete! Best model: XGBoost",
  "result": {
    "best_model": "XGBoost",
    "feature_count": 48,
    "metrics": [
      { "Model": "XGBoost", "F1": 0.912, "AUC": 0.967, "precision": 0.934, "recall": 0.891 },
      { "Model": "LightGBM", "F1": 0.897, "AUC": 0.951, "precision": 0.921, "recall": 0.874 },
      { "Model": "RandomForest", "F1": 0.873, "AUC": 0.938, "precision": 0.905, "recall": 0.843 }
    ]
  }
}
```

A `model_training_events` Kafka event is published on completion.

---

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

```json
{ "status": "ok" }
```

---

## Training Pipeline

The full pipeline (`train_runner.py`) runs these stages in order:

1. **Load dataset** — supports `.csv` and `.xlsx`.
2. **Datetime preprocessing** — auto-detects datetime/timestamp column; auto-detects inverter/plant/device ID column.
3. **Target label creation** — auto-detects failure/fault column; applies `shift(-48)` per inverter group to create the `future_failure_7_10_days` binary target (48 × 30 min = 24 h lookahead, extended to 7–10 day window via rolling features).
4. **Data cleaning** — drop duplicates; fill missing numeric values with **column median**.
5. **Feature engineering** — per sensor per inverter: 24-step rolling mean (trend) and diff (rate of change).
6. **Feature selection** — all numeric columns excluding target, datetime, inverter_id.
7. **Time-based split** — 80% train / 20% test in chronological order (no data leakage).
8. **Train models** — XGBoost (`hist` CPU / `gpu_hist` GPU), LightGBM, RandomForest.
9. **Evaluate** — F1, AUC-ROC, Precision, Recall on held-out test set.
10. **SHAP explainability** — `TreeExplainer` on best model; saves `shap_summary.png`.
11. **Serialize** — all models saved as `<name>.pkl`; best model copied to `trained_model.pkl`; feature columns, metrics also persisted.

---

## Redis Integration

`redis_store.py` handles two keys:

| Key | Purpose | TTL |
|-----|---------|-----|
| `inverter:features:{inverter_id}` | Cached feature dict for fast prediction lookup | 24 h |
| `ml:training:status` | Live training pipeline status (`status`, `progress`, `message`, `result`) | 1 h |

---

## Kafka Events Published

| Topic | When | Payload fields |
|-------|------|---------------|
| `prediction_events` | After every `/predict` call | `requestId`, `inverterId`, `riskScore`, `modelOutput`, `topFeatures`, `userId` |
| `model_training_events` | After training completes | `event`, `best_model`, `feature_count`, `metrics` |

---

## Env

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker address(es) |
| `KAFKA_TOPIC_PREDICTIONS` | `prediction_events` | Topic for prediction events |
| `KAFKA_TOPIC_TRAINING` | `model_training_events` | Topic for training events |
| `ML_USE_GPU` | _(unset)_ | Set to `1` to enable GPU training (XGBoost `gpu_hist`, LightGBM `device_type=gpu`) |

---

## Docker

```bash
docker build -t ml-server .
docker run -p 8000:8000 \
  -e REDIS_URL=redis://localhost:6379 \
  -e KAFKA_BROKERS=localhost:9092 \
  ml-server
```

Or via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`

Models are persisted in a named Docker volume (`ml_models`) so they survive container restarts.
