# Infrastructure

Central orchestration and gateway configuration for the AI-Driven Solar Inverter Failure Prediction & Intelligence Platform.

## Contents

- **docker-compose.yml** – Main compose file defining all services (frontend, gateway, main-server, ml-server, llm-service, notification-service, redis, mongodb, kafka, zookeeper).
- **nginx.conf** – Reference NGINX configuration for the API gateway (load balancing, routing, health).

## Usage

From repository root:

```bash
cd infrastructure
docker compose up -d
```

Or from project root:

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

## Environment

Create a `.env` in this directory or in the project root with:

- `JWT_SECRET` – Main server auth
- `GOOGLE_API_KEY` – LLM (Gemini) service
- `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` – MongoDB
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` – Notification service

All services support horizontal scaling via `deploy.replicas` in the compose file.
