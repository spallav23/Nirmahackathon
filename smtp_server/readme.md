# SMTP Notification Service

Consumes Kafka events and sends email alerts when inverter risk exceeds threshold (e.g. via Google SMTP).

## Env

- `KAFKA_BROKERS` – Kafka  
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` – email provider

## Endpoints

- `GET /health` – health check

## Docker

```bash
docker build -t notification-service .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
