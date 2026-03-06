# Main Backend Server (Node.js + Express)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install --production
COPY . .

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=15s \
  CMD wget -q --spider http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
