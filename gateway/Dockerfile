# NGINX API Gateway + Load Balancer
FROM nginx:1.25-alpine

# Remove default config and use our gateway config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=5s \
  CMD wget -q --spider http://localhost:80/health || exit 1
