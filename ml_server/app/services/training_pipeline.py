import asyncio
import uuid
import json
import os
import random
import logging
from datetime import datetime

from app.models.dummy_model import DummyModel
from app.services.model_registry import registry, METADATA_PATH

logger = logging.getLogger("ml_server.training")

async def run_training_pipeline_task(job_id: str):
    """
    Simulates a long-running MLOps background job that trains a new model version
    and autonomously adds it to the Model Store.
    """
    logger.info(f"[Job {job_id}] Starting continuous learning pipeline...")
    
    # Simulating Phase 1: Data ingestion
    await asyncio.sleep(2)
    logger.info(f"[Job {job_id}] Downloaded 500,000 new telemetry records.")
    
    # Simulating Phase 2: Training
    await asyncio.sleep(3)
    logger.info(f"[Job {job_id}] Model training step complete. Extracting hyperparameters.")
    
    # Phase 3: Evaluation (Mock new F1/AUC scores, randomly performing slightly better or worse)
    base_f1 = 0.85
    new_f1 = round(random.uniform(base_f1 - 0.05, base_f1 + 0.12), 3)
    new_auc = round(min(new_f1 + 0.02, 0.99), 3)
    
    version_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    new_model_id = f"dummy_v{version_str}"
    
    logger.info(f"[Job {job_id}] Candidate Model {new_model_id} generated. F1: {new_f1}, AUC: {new_auc}")

    # Phase 4: Model Registration & Storage
    update_metadata_ledger(new_model_id, new_f1, new_auc)
    
    # Force the in-memory registry to reload the new ledger immediately
    registry.load_registry()
    logger.info(f"[Job {job_id}] Training pipeline fully finished. Registry re-loaded.")


def update_metadata_ledger(model_id: str, f1: float, auc: float):
    """
    Thread-safe-ish (in this context) ledger updater.
    """
    if not os.path.exists(METADATA_PATH):
        logger.error(f"Cannot update ledger: {METADATA_PATH} missing.")
        return
        
    try:
        with open(METADATA_PATH, 'r') as f:
            data = json.load(f)
            
        # Append new model
        new_entry = {
            "model_id": model_id,
            "type": "dummy",
            "f1_score": f1,
            "auc_score": auc,
            "is_active": True,
            "filename": "dummy_model.py"
        }
        data["models"].append(new_entry)
        
        with open(METADATA_PATH, 'w') as f:
            json.dump(data, f, indent=4)
            
        logger.info(f"Updated metadata ledger with {model_id}.")
        
    except Exception as e:
        logger.error(f"Failed to update metadata ledger: {e}")
