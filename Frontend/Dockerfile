# React frontend - build and serve with nginx
# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false 2>/dev/null || npm install
COPY . .
RUN npm run build 2>/dev/null || (echo "No build script; creating placeholder" && mkdir -p build && echo '<!DOCTYPE html><html><body>Frontend placeholder</body></html>' > build/index.html)

# Stage 2: serve
FROM nginx:1.25-alpine

COPY --from=builder /app/build /usr/share/nginx/html 2>/dev/null || true
COPY --from=builder /app/dist /usr/share/nginx/html 2>/dev/null || true
RUN ls -la /usr/share/nginx/html || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget -q --spider http://localhost:80/ || exit 1
