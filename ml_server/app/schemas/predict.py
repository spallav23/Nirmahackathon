from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, List

class TelemetryInput(BaseModel):
    inverter_id: str
    temperature_avg: float
    voltage_variance: float
    current_deviation: float
    power_ratio: float
    alarm_frequency: int

class PredictionRequest(BaseModel):
    model_id: str = "auto"
    telemetry: TelemetryInput

class FeatureContribution(BaseModel):
    feature_name: str
    contribution_score: float

class PredictionResponse(BaseModel):
    prediction_id: str
    inverter_id: str
    risk_score: float
    failure_probability: float  # same as risk score usually, just another naming convention
    risk_level: str  # e.g., "High", "Medium", "Low"
    top_features: List[FeatureContribution]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prediction_id": "pred_12345",
                "inverter_id": "INV-A1",
                "risk_score": 0.85,
                "failure_probability": 0.85,
                "risk_level": "High",
                "top_features": [
                    {"feature_name": "temperature_avg", "contribution_score": 0.4},
                    {"feature_name": "voltage_variance", "contribution_score": 0.3}
                ]
            }
        }
    )
