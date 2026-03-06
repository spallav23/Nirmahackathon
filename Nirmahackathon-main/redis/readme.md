# Redis Feature Store

Redis is used **only** as a feature store: processed telemetry features for ML (e.g. temperature_avg, voltage_variance, current_deviation, power_ratio, alarm_frequency) to avoid recomputation.

## Docker

```bash
docker build -t redis .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
