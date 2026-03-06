# ML Server

**Current: temporary server** that returns a random risk score on `POST /predict` and publishes the result to Kafka (`prediction_events`). Replace with real ML models (XGBoost, LightGBM, RandomForest + SHAP) when ready.

Python + FastAPI service for failure prediction (planned): load models, run inference, compute risk score, SHAP explainability. Supports XGBoost, LightGBM, RandomForest.

## Endpoints

- `POST /predict` – prediction  
- `POST /train` – train/retrain  
- `GET /models` – list models  
- `GET /health` – health check

## Env

- `REDIS_URL` – feature store  
- `KAFKA_BROKERS` – events

## Docker

```bash
docker build -t ml-server .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
