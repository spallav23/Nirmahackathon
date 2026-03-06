# Main Server

Node.js + Express backend. Handles auth, user/profile, prediction history, model selection, API aggregation; **only** service that writes to MongoDB.

## Endpoints

- `POST /auth/login` – login  
- `POST /auth/register` – register  
- `POST /predict` – trigger prediction  
- `GET /history` – prediction history  
- `GET /models` – list models  
- `POST /chat` – LLM chat  
- `GET /health` – health check

## Env

- `MONGODB_URI` – MongoDB connection  
- `REDIS_URL` – Redis feature store  
- `KAFKA_BROKERS` – Kafka  
- `JWT_SECRET` – auth signing

## Docker

```bash
docker build -t main-server .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
