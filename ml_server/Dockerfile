# ML Prediction Server (Python + FastAPI)
FROM python:3.11-slim

# Install system dependencies required for ML libraries like LightGBM
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements*.txt ./
# We removed the fallback since we want the real requirements installed or fail
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:8000/health || exit 1

# Updated module path to match the new folder structure
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
