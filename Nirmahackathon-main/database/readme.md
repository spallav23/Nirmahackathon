# Database

MongoDB is the centralized database. Only the **main server** may write to it.

## Collections

- `users`
- `inverter_predictions`
- `models`
- `telemetry_data`
- `alerts`

## Env (via compose)

- `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`
- `MONGO_INITDB_DATABASE` (e.g. `inverter_platform`)

## Docker

```bash
docker build -t mongodb .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
