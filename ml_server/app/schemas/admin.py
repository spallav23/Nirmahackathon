from pydantic import BaseModel

class ModelParameterUpdate(BaseModel):
    base_risk_adjustment: float = 0.0
    temperature_threshold: float = 75.0
    voltage_threshold: float = 10.0
    alarm_threshold: int = 2
