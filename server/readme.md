# Main Server

Node.js + Express backend. Handles **authentication**, user/profile, prediction history, model selection, API aggregation. **Only** service that writes to MongoDB.

## Project structure

```
server/
├── src/
│   ├── config/         # env, db
│   ├── controllers/   # auth, profile, history, summary
│   ├── middleware/    # auth, validate, errorHandler
│   ├── models/        # User, PredictionHistory
│   ├── routes/        # auth, profile, history, summary
│   ├── services/      # geminiService, kafkaConsumer
│   ├── utils/         # tokens, email
│   ├── app.js
│   └── index.js
├── package.json
├── Dockerfile
└── readme.md
```

## Auth APIs

Base path: `/auth` (e.g. `POST /auth/register`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Sign up; sends verification email; returns user + tokens |
| POST | `/auth/login` | Login; returns user + accessToken + refreshToken |
| POST | `/auth/refresh` | Get new access + refresh token using refreshToken |
| POST | `/auth/verify-email` | Verify email with token from link |
| POST | `/auth/resend-verification` | Resend verification email (body: `email`) |
| POST | `/auth/forgot-password` | Request password reset; sends email with link |
| POST | `/auth/reset-password` | Reset password with token from email (body: `token`, `newPassword`) |
| GET | `/auth/me` | Current user (requires `Authorization: Bearer <accessToken>`) |
| POST | `/auth/change-password` | Change password when logged in (body: `currentPassword`, `newPassword`) |

### Example requests

**Register**
```json
POST /auth/register
{ "name": "John Doe", "email": "john@example.com", "password": "secret1234" }
```

**Login**
```json
POST /auth/login
{ "email": "john@example.com", "password": "secret1234" }
```

**Refresh**
```json
POST /auth/refresh
{ "refreshToken": "<refresh_token>" }
```

**Verify email**
```json
POST /auth/verify-email
{ "token": "<token_from_email_link>" }
```

**Forgot password**
```json
POST /auth/forgot-password
{ "email": "john@example.com" }
```

**Reset password**
```json
POST /auth/reset-password
{ "token": "<token_from_email>", "newPassword": "newsecret1234" }
```

**Me (protected)**
```
GET /auth/me
Authorization: Bearer <accessToken>
```

**Change password (protected)**
```json
POST /auth/change-password
Authorization: Bearer <accessToken>
{ "currentPassword": "oldpass", "newPassword": "newpass1234" }
```

## Profile APIs (protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update profile (body: `name`, `email`, `phone`, `avatar`) |

## History APIs (protected)

Prediction records are stored from Kafka `prediction_events` (model risk output). History returns only the current user’s records.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/history` | List history (query: `page`, `limit`, `inverterId`) |
| GET | `/history/:id` | Get one record by id |

Response includes `riskScore`, `modelOutput`, `topFeatures`, `summary` (Gemini), `inverterId`, `createdAt`.

## Summary API (protected)

Gemini-generated summary for a prediction.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/summary` | Generate/save summary. Body: `predictionId` (use stored record) or `riskScore`, `topFeatures`, `modelOutput` |

Returns `{ "success": true, "data": { "summary": "..." } }`. If `predictionId` is provided, the stored record’s summary is updated.

## Kafka → MongoDB

Main server consumes `prediction_events`. Each message is saved to `PredictionHistory` with `userId` (if in payload), `inverterId`, `riskScore`, `modelOutput`, `topFeatures`. A Gemini summary is generated and stored in `summary`. These records appear in `GET /history`.

Expected Kafka payload shape: `{ userId?, inverterId, riskScore, modelOutput?, topFeatures? }`.

## Env

- `MONGODB_URI` – MongoDB connection
- `JWT_SECRET` – signing secret for access/refresh tokens
- `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` – token expiry (default 7d / 30d)
- `FRONTEND_URL` – base URL for verification/reset links in emails
- `SMTP_*` – verification and reset emails
- `GOOGLE_API_KEY` – Gemini API for summaries
- `KAFKA_BROKERS`, `KAFKA_TOPIC_PREDICTIONS` – consume prediction events and store in MongoDB

## Health

- `GET /health` → `{ "status": "ok" }`

## Docker

```bash
docker build -t main-server .
docker run -p 3001:3001 -e MONGODB_URI=... -e JWT_SECRET=... main-server
```

Or via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
