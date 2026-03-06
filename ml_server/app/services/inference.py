import asyncio
import uuid
import logging
from typing import Dict, Any

from app.schemas.predict import PredictionRequest, PredictionResponse, FeatureContribution
from app.services.model_registry import registry

logger = logging.getLogger("ml_server.inference")

async def run_prediction_async(request: PredictionRequest) -> PredictionResponse:
    """
    MLOps Async Inference wrapper.
    Ensures that heavy ML CPU operations do not block the FastAPI event loop.
    """
    requested_model_id = request.model_id
    telemetry_data = request.telemetry.model_dump()
    inverter_id = telemetry_data.get("inverter_id", "unknown")

    # 1. Fetch the Model from Registry
    try:
        model, actual_model_id = registry.get_model(requested_model_id)
    except ValueError as e:
        logger.error(str(e))
        raise e

    # 2. Run Inference in a separate thread to prevent blocking
    logger.info(f"Starting inference async for inverter {inverter_id} using {actual_model_id}")
    try:
        # Run the CPU-bound predict method in a threadpool
        risk_score = await asyncio.to_thread(model.predict, telemetry_data)
        
        # Run the SHAP explainer in a threadpool
        shap_values = await asyncio.to_thread(model.explain, telemetry_data, risk_score)
    except Exception as e:
        logger.error(f"Inference failed for {inverter_id}: {str(e)}")
        raise e

    # Calculate risk level heuristic
    if risk_score > 0.7:
        risk_level = "High"
    elif risk_score > 0.4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Map raw explainer dicts to Pydantic FeatureContributions
    top_features = [
        FeatureContribution(feature_name=sv["feature_name"], contribution_score=sv["contribution_score"]) 
        for sv in shap_values
    ]

    response = PredictionResponse(
        prediction_id=str(uuid.uuid4()),
        inverter_id=inverter_id,
        risk_score=round(risk_score, 4),
        failure_probability=round(risk_score, 4),
        risk_level=risk_level,
        top_features=top_features
    )
    
    logger.info(f"Completed inference for {inverter_id}. Risk: {response.risk_level}")
    return response
