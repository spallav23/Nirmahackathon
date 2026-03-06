# ML Prediction Server (Python + FastAPI)
FROM python:3.11-slim

WORKDIR /app

COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install --no-cache-dir fastapi uvicorn redis kafka-python pydantic

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
