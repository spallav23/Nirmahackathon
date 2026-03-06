# Frontend

**Current: temporary single-page test UI** to exercise all services (auth, profile, history, summary, ML predict). Replace with the full React dashboard when ready.

React operational dashboard for the AI-Driven Solar Inverter Failure Prediction & Intelligence Platform (planned): responsive UI with login, inverter dashboard, risk trend charts, AI explanation panel, and operator query interface.

## Tech

- React, raw CSS
- Recharts (charts), Framer Motion (animations)

## Scripts

- `npm install` – install dependencies
- `npm run build` – production build (output in `build/` or `dist/`)
- `npm start` – dev server

## Docker

```bash
docker build -t frontend .
docker run -p 3000:80 frontend
```

Health: served app must respond at `/` (e.g. `GET /`).

## Pages (required)

1. Login / Authentication  
2. Inverter Dashboard  
3. Risk Trend Charts  
4. Inverter Detail Page  
5. AI Explanation Panel  
6. Operator Query Interface (LLM Q&A)
