# Redis - feature store only (processed telemetry features for ML)
# Use AWS Public ECR mirror to avoid Docker Hub timeouts
FROM public.ecr.aws/docker/library/redis:7-alpine

# Optional: custom redis.conf for persistence or limits
# COPY redis.conf /usr/local/etc/redis/redis.conf
# CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]

EXPOSE 6379

HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
  CMD redis-cli ping || exit 1
