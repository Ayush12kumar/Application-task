from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.hcp import HCPResponse

class FollowupBase(BaseModel):
    hcp_id: int
    interaction_id: Optional[int] = None
    user_id: int = 1
    suggested_date: str
    strategy: str
    talking_points: List[str] = []
    status: str = "pending"
    priority: str = "High"

class FollowupCreate(FollowupBase):
    pass

class FollowupResponse(FollowupBase):
    id: int
    created_at: datetime
    hcp: Optional[HCPResponse] = None

    model_config = ConfigDict(from_attributes=True)
