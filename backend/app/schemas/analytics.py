from pydantic import BaseModel
from typing import List, Dict, Any

class SentimentBreakdown(BaseModel):
    Positive: int
    Neutral: int
    Negative: int

class ProductDiscussionMetric(BaseModel):
    product_name: str
    count: int
    percentage: float

class InteractionTimelineMetric(BaseModel):
    date: str
    visits: int
    calls: int
    emails: int

class AnalyticsSummaryResponse(BaseModel):
    total_hcps: int
    total_interactions: int
    pending_followups: int
    average_sentiment_score: float
    high_priority_actions: int
    opportunity_index: float
    sentiment_breakdown: SentimentBreakdown
    top_products_discussed: List[ProductDiscussionMetric]
    interactions_timeline: List[InteractionTimelineMetric]
    recent_agent_logs: List[Dict[str, Any]]
