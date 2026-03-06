# LLM Service (RAG + Gemini)
FROM python:3.11-slim

WORKDIR /app

COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || pip install --no-cache-dir fastapi uvicorn google-generativeai chromadb pydantic

COPY . .

EXPOSE 8001

ENV PORT=8001

HEALTHCHECK --interval=20s --timeout=5s --retries=3 --start-period=15s \
  CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
