# MongoDB - centralized database for the platform
FROM mongo:7

# Optional: copy init scripts for collections (users, inverter_predictions, models, telemetry_data, alerts)
# COPY init.js /docker-entrypoint-initdb.d/

EXPOSE 27017

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
  CMD mongosh --eval "db.adminCommand('ping')" || exit 1
