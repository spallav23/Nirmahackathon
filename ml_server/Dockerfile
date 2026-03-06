# ML Prediction Server - AI-Driven Solar Inverter Failure Prediction
# Supports XGBoost, LightGBM, RandomForest; SHAP explainability; Redis; Kafka
FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /app

# Install curl for healthcheck and system deps
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run tests before image creation (per base prompt)
RUN pytest tests/ -v --tb=short

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
