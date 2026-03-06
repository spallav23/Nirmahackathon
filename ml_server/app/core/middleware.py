import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("ml_server")
logging.basicConfig(level=logging.INFO)

class LatencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log the latency. In a real MLOps setup, push this to Prometheus/Grafana.
        if request.url.path == "/predict":
             logger.info(f"Inference Latency: {process_time:.4f} seconds for path {request.url.path}")
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
