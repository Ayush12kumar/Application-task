from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from app.schemas.hcp import HCPResponse

class SampleGiven(BaseModel):
    product: str
    quantity: int

class InteractionBase(BaseModel):
    hcp_id: int
    user_id: int = 1
    interaction_date: str
    interaction_type: str = "Visit"
    duration_minutes: int = 30
    discussion_topics: Optional[str] = None
    products_discussed: List[str] = Field(default_factory=list)
    samples_given: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: str = "Positive"
    priority: str = "Medium"
    next_action: Optional[str] = None
    confidence_score: float = 0.95
    status: str = "saved"

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    interaction_date: Optional[str] = None
    interaction_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    discussion_topics: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    samples_given: Optional[List[Dict[str, Any]]] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    priority: Optional[str] = None
    next_action: Optional[str] = None
    status: Optional[str] = None

class InteractionHistoryResponse(BaseModel):
    id: int
    interaction_id: int
    version: int
    changed_by_user_id: int
    previous_data: Dict[str, Any]
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InteractionResponse(InteractionBase):
    id: int
    version: int
    created_at: datetime
    updated_at: datetime
    hcp: Optional[HCPResponse] = None
    history: Optional[List[InteractionHistoryResponse]] = None

    model_config = ConfigDict(from_attributes=True)

class InteractionListResponse(BaseModel):
    total: int
    items: List[InteractionResponse]
