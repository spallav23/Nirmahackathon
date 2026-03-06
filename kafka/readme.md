# Kafka

Apache Kafka event bus for the platform.

## Topics

- `prediction_events`
- `notification_events`
- `model_training_events`

## Docker

Uses Bitnami Kafka image. Zookeeper is defined in the main compose file.

```bash
docker build -t kafka .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d` (starts zookeeper + kafka).
