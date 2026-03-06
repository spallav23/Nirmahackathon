# ML Prediction Server (Python + FastAPI)
# Use AWS Public ECR mirror to avoid Docker Hub timeouts
FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /app

COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install --no-cache-dir fastapi uvicorn redis kafka-python pydantic

# Install curl for container-level healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
