# SMTP Notification Service (Node.js + Express)
# Consumes Kafka notification_events and sends alerts via Google SMTP

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --production
COPY . .

EXPOSE 3002

# --- Update these in docker-compose or at runtime (docker run -e) ---
ENV NODE_ENV=production
ENV PORT=3002

# Kafka
ENV KAFKA_BROKERS=kafka:9092
ENV KAFKA_TOPIC_NOTIFICATIONS=notification_events

# Google SMTP (Gmail)
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=587
ENV SMTP_SECURE=false
ENV SMTP_USER=spp23102003@gmail.com
ENV SMTP_PASS=cscv mirq sqgr wnhz
ENV SMTP_FROM=spp23102003@gmail.com

# Optional: default recipient for alerts (defaults to SMTP_USER if not set)
ENV ALERT_EMAIL_TO=spp23102003@gmail.com

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -q --spider http://localhost:3002/health || exit 1

CMD ["node", "index.js"]
