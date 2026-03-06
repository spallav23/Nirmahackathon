# AI-Driven Solar Inverter Failure Prediction & Intelligence Platform

Microservices platform to predict solar inverter failure risk (7–10 days) using ML, with LLM-generated explanations and event-driven notifications.

---

## Prerequisites

- **Docker** and **Docker Compose**
- (Optional) **.env** file for secrets (see [Environment](#environment))

---

## How to Start Everything

From the **project root** (`code/`):

```bash
cd infrastructure
docker compose up -d
```

Or from project root:

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

Wait for all services to become healthy (about 1–2 minutes). Check status:

```bash
docker compose -f infrastructure/docker-compose.yml ps
```

To view logs:

```bash
docker compose -f infrastructure/docker-compose.yml logs -f
```

To stop:

```bash
docker compose -f infrastructure/docker-compose.yml down
```

---

## Where to See the App (URLs)

All user-facing traffic goes through the **API Gateway** on port **80**.

| What | URL | Notes |
|------|-----|--------|
| **Web app (frontend)** | **http://localhost** | Main entry. Served by gateway; use this to test the UI. |
| **Frontend only** (direct) | http://localhost:3000 | Frontend container port; use if you want to hit the app without gateway. |

There is **no separate URL for the gateway** itself: you use **http://localhost** and the gateway routes to the frontend and to the backend APIs under `/api`, `/ml`, `/llm` as below.

---

## APIs Exposed (via Gateway)

The gateway listens on **port 80**. All APIs below are relative to **http://localhost** (or your host).

Base URL when using the gateway: **http://localhost**

| Path prefix | Backend service | Description |
|-------------|----------------|-------------|
| **/** | Frontend | Web UI (temp test page or dashboard). |
| **/api/** | Main server (Node.js) | Auth, profile, history, summary. |
| **/ml/** | ML server (Python) | Predictions (e.g. random score in temp setup). |
| **/llm/** | LLM service (Python) | Explain / ask (RAG + Gemini). |
| **/health** | Gateway | Gateway health: `GET http://localhost/health` → `{"status":"ok"}`. |

### Main server APIs (use prefix `/api`)

Example base: **http://localhost/api**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check. |
| POST | `/api/auth/register` | Sign up. |
| POST | `/api/auth/login` | Login (returns access + refresh tokens). |
| POST | `/api/auth/refresh` | Refresh tokens. |
| POST | `/api/auth/verify-email` | Verify email with token. |
| POST | `/api/auth/resend-verification` | Resend verification email. |
| POST | `/api/auth/forgot-password` | Request password reset. |
| POST | `/api/auth/reset-password` | Reset password with token. |
| GET | `/api/auth/me` | Current user (requires `Authorization: Bearer <token>`). |
| POST | `/api/auth/change-password` | Change password (protected). |
| GET | `/api/profile` | Get profile (protected). |
| PUT | `/api/profile` | Update profile (protected). |
| GET | `/api/history` | Prediction history (protected). Query: `?page=1&limit=20&inverterId=...` |
| GET | `/api/history/:id` | One history record (protected). |
| POST | `/api/summary` | Generate Gemini summary (protected). Body: `predictionId` or `riskScore`, `topFeatures`, `modelOutput`. |

### ML server APIs (use prefix `/ml`)

Example base: **http://localhost/ml**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ml/health` | Health check. |
| POST | `/ml/predict` | Run prediction (temp: random score, publishes to Kafka). Body: `inverterId`, optional `userId`. |

### LLM service APIs (use prefix `/llm`)

Example base: **http://localhost/llm**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/llm/health` | Health check. |
| POST | `/llm/explain` | Get explanation for a prediction. |
| POST | `/llm/ask` | Operator Q&A (RAG). |

### Example API calls (gateway on localhost)

```bash
# Health
curl http://localhost/health
curl http://localhost/api/health
curl http://localhost/ml/health

# Register
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Profile (use token from login)
curl http://localhost/api/profile -H "Authorization: Bearer <accessToken>"

# ML predict (temp random score + Kafka)
curl -X POST http://localhost/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"inverterId":"INV-001"}'
```

---

## Direct Service Ports (without gateway)

If you want to call services directly (e.g. for debugging):

| Service | Port | URL |
|---------|------|-----|
| Gateway | 80 | http://localhost:80 |
| Frontend | 3000 | http://localhost:3000 |
| Main server | 3001 | http://localhost:3001 |
| ML server | 8000 | http://localhost:8000 |
| LLM service | 8001 | http://localhost:8001 |
| Notification (SMTP) | 3002 | http://localhost:3002 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |
| Kafka | 9092, 9093 | localhost:9092 (internal), 9093 (external) |

When using the gateway, **prefer http://localhost** and **/api**, **/ml**, **/llm** so routing and CORS stay consistent.

---

## Environment

Create a `.env` file in **`infrastructure/`** or in the **project root** and set:

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Main server auth (required in production). |
| `GOOGLE_API_KEY` | Gemini (LLM + summary). |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` | MongoDB admin (optional). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Email (verification, reset, notifications). |
| `KAFKA_BROKERS`, `KAFKA_TOPIC_PREDICTIONS` | Override Kafka connection/topic (optional). |

Example (no real secrets):

```env
JWT_SECRET=your-secret-change-in-production
GOOGLE_API_KEY=your-gemini-api-key
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=admin
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

---

## Project Structure

```
code/
├── Frontend/           # Web UI (temp test page)
├── gateway/             # NGINX API gateway
├── server/              # Main backend (Node.js): auth, profile, history, summary
├── ml_server/           # ML service (Python): predictions (temp: random + Kafka)
├── llm_service/        # LLM service (Python): RAG + Gemini
├── smtp_server/        # Notification service: Kafka → email
├── database/            # MongoDB
├── kafka/               # Kafka
├── redis/               # Redis feature store
├── infrastructure/
│   ├── docker-compose.yml   # Start everything here
│   └── nginx.conf           # Gateway config reference
└── readme.md            # This file
```

Each service folder has its own **Dockerfile**, **.gitignore**, and **readme.md**.

---

## Quick Test Flow

1. Start stack: `docker compose -f infrastructure/docker-compose.yml up -d`
2. Open **http://localhost** in the browser (temp test UI).
3. Register and login; use **GET /api/profile** and **PUT /api/profile** to test profile.
4. Call **POST /ml/predict** (from UI or curl); main server consumes from Kafka and stores the result.
5. Use **GET /api/history** to see stored predictions (with risk score and summary).
6. Use **POST /api/summary** with a `predictionId` from history to (re)generate a Gemini summary.

---

## Troubleshooting

- **Gateway not responding:** Ensure gateway, frontend, main-server, and ml-server are healthy: `docker compose -f infrastructure/docker-compose.yml ps`
- **401 on /api/profile or /history:** Use the token from login in the header: `Authorization: Bearer <accessToken>`
- **History empty after ML predict:** Main server must be connected to Kafka and consuming `prediction_events`; check main-server logs. Ensure ML predict request includes `userId` if you want the record tied to the current user.
