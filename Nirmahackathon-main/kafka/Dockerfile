# Apache Kafka - event bus (uses Bitnami image with optional custom config)
FROM bitnami/kafka:3.6

# Optional: copy custom server.properties
# COPY server.properties /opt/bitnami/kafka/config/

EXPOSE 9092 9093

# Health check is set in docker-compose (kafka-topics.sh)
