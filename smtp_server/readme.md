# SMTP Notification Service

Node.js + Express service that consumes **Kafka** `notification_events` and sends email alerts via **Google SMTP** when inverter risk exceeds threshold.

## Flow

Kafka message (JSON) → parse → build email → send via Nodemailer (Gmail).

## Env (update in Dockerfile or docker-compose / `docker run -e`)

| Variable | Description | Example |
|----------|-------------|---------|
| `KAFKA_BROKERS` | Kafka broker list | `kafka:9092` |
| `KAFKA_TOPIC_NOTIFICATIONS` | Topic to consume | `notification_events` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Gmail address | `you@gmail.com` |
| `SMTP_PASS` | App password (not account password) | — |
| `SMTP_FROM` | From address (defaults to `SMTP_USER`) | — |
| `ALERT_EMAIL_TO` | Default alert recipient | — |

For Gmail use an [App Password](https://support.google.com/accounts/answer/185833); do not commit real values.

## Kafka message shape (example)

```json
{
  "inverterId": "INV-204",
  "riskPercent": 78,
  "primaryCause": "Temperature instability",
  "recommendedAction": "Schedule inspection",
  "recipient": "ops@example.com"
}
```

## Endpoints

- `GET /health` – returns `{"status":"ok"}`

## Docker

```bash
docker build -t notification-service .
docker run -e SMTP_USER=you@gmail.com -e SMTP_PASS=xxxx notification-service
```

Or run via main compose and set env in `infrastructure/docker-compose.yml` under `notification-service.environment`.
