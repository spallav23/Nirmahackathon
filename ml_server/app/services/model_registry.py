import os
import json
import logging
from typing import Dict, Any
from app.models.dummy_model import DummyModel

logger = logging.getLogger("ml_server.registry")
METADATA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'model_store', 'metadata.json')

class ModelRegistry:
    """
    MLOps Model Registry Utility
    Dynamically loads models from the metadata ledger and selects the best performer.
    """
    def __init__(self):
        self._models = {}
        self._metadata = []
        self.load_registry()

    def load_registry(self):
        """Read the metadata.json and instantiate models."""
        if not os.path.exists(METADATA_PATH):
            logger.warning(f"Metadata ledger not found at {METADATA_PATH}. Creating empty registry.")
            return
            
        try:
            with open(METADATA_PATH, 'r') as f:
                data = json.load(f)
                self._metadata = data.get("models", [])
                
            for meta in self._metadata:
                if meta.get("is_active"):
                    model_id = meta["model_id"]
                    model_type = meta["type"]
                    
                    if model_type == "dummy":
                        logger.info(f"Loading Dummy Model: {model_id} (F1: {meta.get('f1_score')})")
                        self._models[model_id] = DummyModel(model_id=model_id)
                    # Future implementation for teammate's real model:
                    # elif model_type == "xgboost":
                    #     filepath = os.path.join('model_store', meta["filename"])
                    #     self._models[model_id] = XGBoostPredictor(filepath)
                    else:
                        logger.warning(f"Unknown model type '{model_type}' for {model_id}")
        except Exception as e:
            logger.error(f"Failed to load model registry: {e}")

    def get_model(self, model_id: str) -> Any:
        # If auto is requested, find the best
        if model_id.lower() == "auto":
            model_id = self.get_best_model_id()
            logger.info(f"'auto' model requested. Selected mathematically best model: {model_id}")

        if model_id not in self._models:
            logger.error(f"Requested model {model_id} not found in registry.")
            raise ValueError(f"Model ID '{model_id}' is not loaded.")
            
        return self._models[model_id], model_id

    def get_best_model_id(self) -> str:
        """Selects the active model with the highest F1 score."""
        if not self._metadata:
            raise ValueError("No models available in the registry metadata.")
            
        active_models = [m for m in self._metadata if m.get("is_active")]
        if not active_models:
            raise ValueError("No active models available.")
            
        # Sort by F1 score descending
        best_model = sorted(active_models, key=lambda x: x.get("f1_score", 0), reverse=True)[0]
        return best_model["model_id"]

    def list_models(self) -> list:
        return self._metadata

# Singleton instance
registry = ModelRegistry()
