# SMTP Notification Service
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --production
COPY . .

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -q --spider http://localhost:3002/health || exit 1

CMD ["node", "index.js"]
