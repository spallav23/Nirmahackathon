# Main Backend Server (Node.js + Express)
# Use AWS Public ECR mirror to avoid Docker Hub timeouts
FROM public.ecr.aws/docker/library/node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --production
COPY . .

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV MONGODB_URI=mongodb://mongodb:27017/inverter_platform
ENV JWT_SECRET=
ENV JWT_EXPIRES_IN=7d
ENV FRONTEND_URL=http://localhost:3000
ENV SMTP_HOST=smtp.gmail.com
ENV SMTP_PORT=587
ENV SMTP_USER=
ENV SMTP_PASS=
ENV SMTP_FROM=
ENV GOOGLE_API_KEY=
ENV KAFKA_BROKERS=kafka:9092
ENV KAFKA_TOPIC_PREDICTIONS=prediction_events

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=15s \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
