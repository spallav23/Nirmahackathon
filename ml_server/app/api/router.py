from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List

from app.schemas.predict import PredictionRequest, PredictionResponse
from app.services.inference import run_prediction_async
from app.services.model_registry import registry
from app.services.kafka_producer import producer_instance

router = APIRouter()

@router.get("/health")
def health_check():
    """Simple health check endpoint"""
    return {"status": "ok"}

@router.get("/models")
def list_models():
    """Retrieve available ML models"""
    return {"available_models": registry.list_models()}

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predicts the risk of inverter failure asynchronously using the best model.
    """
    try:
        # Run prediction asynchronously
        prediction = await run_prediction_async(request)
        
        # Emit an asynchronous event to Kafka with the prediction results
        event_payload = {
            "event_type": "inverter_risk_prediction",
            "prediction_id": prediction.prediction_id,
            "inverter_id": prediction.inverter_id,
            "risk_score": prediction.risk_score,
            "risk_level": prediction.risk_level,
            "timestamp": "now" # In real app, standard ISO format
        }
        producer_instance.send_event(event_payload)
        
        return prediction

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference process failed: {str(e)}")

from fastapi import BackgroundTasks
@router.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    """
    Endpoint for admins to trigger a model retraining pipeline.
    Runs entirely in the background so the API does not block.
    """
    import uuid
    job_id = str(uuid.uuid4())[:8]
    
    from app.services.training_pipeline import run_training_pipeline_task
    background_tasks.add_task(run_training_pipeline_task, job_id)
    
    return {
        "status": "queued",
        "job_id": job_id,
        "message": "Continuous Learning pipeline triggered. Monitor server logs."
    }

from app.schemas.admin import ModelParameterUpdate
@router.put("/models/{model_id}/parameters")
async def update_model_parameters(model_id: str, params: ModelParameterUpdate):
    """
    MLOps Admin Endpoint:
    Dynamically adjust hyperparameters/thresholds of a running model in the registry
    without needing to restart the FastAPI server.
    """
    try:
        model, actual_id = registry.get_model(model_id)
        
        # Check if the model supports dynamic updates (our DummyModel does)
        if hasattr(model, 'update_parameters'):
            model.update_parameters(params.model_dump())
            return {
                "status": "success", 
                "message": f"Parameters updated for model {actual_id}",
                "new_parameters": params.model_dump()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Model {actual_id} does not support dynamic parameter updates.")
            
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

from fastapi import UploadFile, File
@router.post("/models/upload")
async def upload_model(file: UploadFile = File(...)):
    """
    Endpoint for a teammate's CI/CD pipeline to upload a new .pkl model.
    In real life this would save to model_store/ and dynamically update metadata.json.
    """
    return {
        "status": "success",
        "message": f"Successfully received {file.filename}.",
        "instruction": "Registry metadata update logic is currently stubbed."
    }
