# ML Server

Python + FastAPI service for failure prediction: load models, run inference, compute risk score, SHAP explainability. Supports XGBoost, LightGBM, RandomForest.

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
