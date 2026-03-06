import logging
from typing import Dict, Any
from app.models.dummy_model import DummyModel

logger = logging.getLogger("ml_server.registry")

class ModelRegistry:
    """
    MLOps Model Registry Utility
    In production, this could connect to MLflow or a cloud bucket.
    """
    def __init__(self):
        self._models = {}
        # Pre-load the dummy model on startup
        self.register_model("dummy_v1", DummyModel(model_id="dummy_v1"))

    def register_model(self, model_id: str, model_instance: Any):
        logger.info(f"Registering model: {model_id}")
        self._models[model_id] = model_instance

    def get_model(self, model_id: str) -> Any:
        if model_id not in self._models:
            logger.error(f"Requested model {model_id} not found in registry.")
            raise ValueError(f"Model ID '{model_id}' is not loaded.")
        return self._models[model_id]

    def list_models(self) -> list:
        return list(self._models.keys())

# Singleton instance
registry = ModelRegistry()
