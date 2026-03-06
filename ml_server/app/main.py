import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.router import router as api_router
from app.core.middleware import LatencyMiddleware

app = FastAPI(
    title="ML Prediction Service",
    description="Scalable Inference Server for Solar Inverter Predictions",
    version="1.0.0"
)

# CORS Middleware (To interface with React frontend through API Gateway or directly for debugging)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom MLOps Latency Logging Middleware
app.add_middleware(LatencyMiddleware)

# Include core routes
app.include_router(api_router)

if __name__ == "__main__":
    # Standard Uvicorn startup (development mode)
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
