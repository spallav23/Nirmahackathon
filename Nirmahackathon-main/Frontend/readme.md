# Frontend – AI-Driven Solar Inverter Failure Prediction Platform

React operational dashboard: login, inverter dashboard, risk trend charts, inverter detail, AI explanation panel, and operator Q&A. Built with **React**, **raw CSS**, **Recharts**, and **Framer Motion**. Fully responsive with skeleton loading and smooth scrolling.

---

## Complete steps (module-wise)

### Module 1: Project setup

1. **Install dependencies**
   ```bash
   cd Frontend
   npm install
   ```

2. **Run development server**
   ```bash
   npm start
   ```
   Opens at `http://localhost:3000`. For API calls to work, either run the full stack (see **Running with backend** below) or use demo/skip-login to see the UI with mock data.

3. **Production build**
   ```bash
   npm run build
   ```
   Output is in `build/`. The Dockerfile uses this for the container image.

---

### Module 2: Authentication

- **Login / Register** – `src/pages/Login.js`
  - Uses `POST /api/auth/login` and `POST /api/auth/register` via gateway.
  - “Skip to dashboard (demo)” sets a demo token and navigates without a real backend.
- **Auth state** – `src/context/AuthContext.js`
  - Provides `login`, `register`, `logout`, `demoLogin`, and `isAuthenticated`.
- **Protected routes** – `src/App.js`
  - All dashboard routes require authentication; unauthenticated users are redirected to `/login`.

---

### Module 3: Inverter dashboard

- **Page** – `src/pages/InverterDashboard.js`
  - Fetches `GET /api/history` and `GET /api/models`.
  - Summary cards: total inverters, high-risk count, models available.
  - **Risk score per inverter** – Recharts bar chart (risk score per inverter).
  - **Inverter table** – ID, latest risk score, level (high/medium/low), links to Detail and Explain.
  - **Top failure risk** – List of high-risk inverters with links.
- **Styling** – `src/styles/Dashboard.module.css`
- **Fallback** – If API fails, mock inverter data is shown so the UI still works.

---

### Module 4: Risk trend charts

- **Page** – `src/pages/RiskTrendCharts.js`
  - Uses `GET /api/history` to build trend data.
  - **Historical risk trends** – Recharts area/line chart (avg and max risk over time).
  - **Top failure factors** – Horizontal bar chart (e.g. temperature variance, voltage instability).
- **Styling** – `src/styles/Trends.module.css`

---

### Module 5: Inverter detail page

- **Page** – `src/pages/InverterDetail.js`
  - Route: `/inverter/:id`
  - Loads history for that inverter and shows latest risk score, level, and prediction count.
  - **Top contributing factors** – From prediction payload (e.g. SHAP/top features).
  - **Recent history** – Table of past predictions with date, score, level.
  - Link to **AI Explanation** for that inverter.
- **Styling** – `src/styles/Detail.module.css`

---

### Module 6: AI explanation panel

- **Page** – `src/pages/AIExplanationPanel.js`
  - Route: `/explain/:id`
  - Calls `POST /llm/explain` with `{ inverterId }` (via gateway path `/llm/explain`).
  - Renders natural-language summary and suggested actions.
- **Styling** – `src/styles/Explain.module.css`

---

### Module 7: Operator query interface (LLM Q&A)

- **Page** – `src/pages/OperatorQuery.js`
  - Route: `/query`
  - Uses `POST /api/chat` with `{ message }` for operator questions (e.g. “Which inverters in Block B have elevated risk?”).
  - Sample questions and chat-style message list.
- **Styling** – `src/styles/Query.module.css`

---

### Module 8: Shared components and layout

- **Layout** – `src/components/Layout.js`
  - Sidebar nav (Dashboard, Risk Trends, Operator Q&A), user name, Logout.
  - Responsive: sidebar collapses to top nav on small screens.
- **Skeleton loading** – `src/components/Skeleton.js`
  - `SkeletonLine`, `SkeletonCard`, `SkeletonChart`, `SkeletonTable` with shimmer animation (Framer Motion + CSS).
- **Global styles** – `src/styles/global.css`
  - CSS variables (colors, spacing), smooth scroll, risk-level classes.
- **Layout styles** – `src/styles/layout.css`

---

### Module 9: API client

- **Client** – `src/api/client.js`
  - Base URL: same origin by default, or `REACT_APP_API_BASE` for local dev (e.g. `http://localhost` when gateway runs on 80).
  - Exports: `auth`, `predictions`, `models`, `chat`, `llm`, `health`.
  - All requests add `Authorization: Bearer <token>` when token is in `localStorage`.
  - Gateway routes: `/api/*` → main server, `/ml/*` → ML server, `/llm/*` → LLM service.

---

### Module 10: Routing and app entry

- **Routes** – `src/App.js`
  - `/login` → Login
  - `/` (protected) → Layout with nested: `/dashboard`, `/trends`, `/inverter/:id`, `/explain/:id`, `/query`.
  - Default redirect `/` → `/dashboard`; unknown paths → `/`.
- **Entry** – `src/index.js`
  - Renders `App` inside `BrowserRouter` and `AuthProvider`, imports global and layout CSS.

---

## Running with backend (full stack)

1. From repo root:
   ```bash
   docker compose -f infrastructure/docker-compose.yml up -d
   ```
2. Open **http://localhost** (NGINX gateway). The gateway serves the frontend and proxies:
   - `/api/*` → main server  
   - `/ml/*` → ML server  
   - `/llm/*` → LLM service  

3. **Local dev (frontend only)** with backend on Docker:
   - Run `npm start` in `Frontend`.
   - Set `REACT_APP_API_BASE=http://localhost` in `.env` (or the URL where gateway is reachable) so API calls go to the gateway.

---

## Folder structure

```
Frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── client.js          # API client (auth, predictions, models, chat, llm)
│   ├── components/
│   │   ├── Layout.js
│   │   └── Skeleton.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── InverterDashboard.js
│   │   ├── RiskTrendCharts.js
│   │   ├── InverterDetail.js
│   │   ├── AIExplanationPanel.js
│   │   └── OperatorQuery.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── layout.css
│   │   ├── Login.module.css
│   │   ├── Dashboard.module.css
│   │   ├── Trends.module.css
│   │   ├── Detail.module.css
│   │   ├── Explain.module.css
│   │   ├── Query.module.css
│   │   └── Skeleton.module.css
│   ├── App.js
│   └── index.js
├── package.json
├── Dockerfile
└── README.md
```

---

## Tech summary

| Requirement        | Implementation                          |
|--------------------|------------------------------------------|
| Framework          | React + raw CSS                          |
| Charts             | Recharts (bar, area, line)               |
| Animations         | Framer Motion + CSS keyframes            |
| Responsive         | CSS layout + media queries               |
| Skeleton loading   | `Skeleton.js` + Skeleton.module.css      |
| Smooth scrolling   | `scroll-behavior: smooth` in global.css  |
| Routing            | react-router-dom v6                      |

All six required pages are implemented and wired to the API gateway paths above.
