# Gateway

NGINX API Gateway and load balancer for the platform. Routes frontend, main server, ML server, and LLM service; supports health checks and horizontal scaling.

## Build

```bash
docker build -t gateway .
```

## Run (standalone)

Requires other services (frontend, main-server, ml-server, llm-service) on the same network. Prefer running via main compose:

```bash
docker compose -f ../infrastructure/docker-compose.yml up -d
```

## Health

`GET /health` returns `{"status":"ok"}`.

## Routing

- `/` → frontend
- `/api/*` → main-server
- `/ml/*` → ml-server
- `/llm/*` → llm-service
