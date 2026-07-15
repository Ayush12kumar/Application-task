from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ExtractedPreview(BaseModel):
    hcp_id: Optional[int] = None
    hcp_name: Optional[str] = None
    hospital: Optional[str] = None
    specialization: Optional[str] = None
    interaction_date: Optional[str] = None
    interaction_type: Optional[str] = "Visit"
    products_discussed: List[str] = Field(default_factory=list)
    samples_given: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: str = "Positive"
    priority: str = "Medium"
    next_action: Optional[str] = None
    confidence_score: float = 0.96
    duplicate_warning: Optional[str] = None

class LangGraphStep(BaseModel):
    node: str
    tool_used: Optional[str] = None
    input_summary: str
    output_summary: str
    latency_ms: float

class ChatRequest(BaseModel):
    session_id: str
    user_id: int = 1
    hcp_id: Optional[int] = None
    message: str
    mode: str = "chat"  # chat, voice_transcript, general_assistant

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    intent: str
    extracted_preview: Optional[ExtractedPreview] = None
    trace: List[LangGraphStep] = Field(default_factory=list)
    confidence_score: float = 0.96
