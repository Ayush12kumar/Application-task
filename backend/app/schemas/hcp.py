from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class HCPBase(BaseModel):
    name: str
    hospital: str
    specialization: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: str = "Priority A"

class HCPCreate(HCPBase):
    relationship_score: Optional[float] = 75.0
    risk_score: Optional[float] = 15.0
    opportunity_score: Optional[float] = 85.0

class HCPUpdate(BaseModel):
    name: Optional[str] = None
    hospital: Optional[str] = None
    specialization: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tier: Optional[str] = None
    relationship_score: Optional[float] = None
    risk_score: Optional[float] = None
    opportunity_score: Optional[float] = None

class HCPResponse(HCPBase):
    id: int
    relationship_score: float
    risk_score: float
    opportunity_score: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HCPSearchResult(BaseModel):
    total: int
    items: List[HCPResponse]
