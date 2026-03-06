# LLM Service (RAG)

Python + FastAPI service using Google Gemini and RAG (ChromaDB/FAISS) to generate human-readable explanations and answer operator questions.

## Endpoints

- `POST /explain` – prediction explanation  
- `POST /ask` – operator Q&A  
- `GET /health` – health check

## Env

- `GOOGLE_API_KEY` – Gemini API  
- `KAFKA_BROKERS` – optional event integration

## Docker

```bash
docker build -t llm-service .
```

Run via main compose: `docker compose -f infrastructure/docker-compose.yml up -d`
