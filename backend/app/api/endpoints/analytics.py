from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.schema import HCP, Interaction, Followup, AgentLog
from app.schemas.analytics import AnalyticsSummaryResponse, SentimentBreakdown, ProductDiscussionMetric, InteractionTimelineMetric
from collections import Counter
from datetime import datetime

router = APIRouter()

@router.get("/analytics", response_model=AnalyticsSummaryResponse)
def get_analytics_dashboard(db: Session = Depends(get_db)):
    """
    GET /analytics
    Aggregate KPIs, sentiment distribution, top products, interaction timelines, and recent agent execution logs.
    """
    total_hcps = db.query(HCP).count()
    total_interactions = db.query(Interaction).count()
    pending_followups = db.query(Followup).filter(Followup.status == "pending").count()
    
    interactions = db.query(Interaction).all()
    
    # Sentiment distribution
    pos_count = sum(1 for i in interactions if i.sentiment == "Positive")
    neu_count = sum(1 for i in interactions if i.sentiment == "Neutral")
    neg_count = sum(1 for i in interactions if i.sentiment == "Negative")
    
    avg_sentiment = round(((pos_count * 100.0) + (neu_count * 50.0)) / max(total_interactions, 1), 1)
    
    # High priority actions & opportunity index
    high_priority = sum(1 for i in interactions if i.priority == "High")
    
    hcps = db.query(HCP).all()
    avg_opportunity = round(sum(h.opportunity_score for h in hcps) / max(len(hcps), 1), 1)

    # Top products breakdown
    product_counter = Counter()
    for i in interactions:
        for p in (i.products_discussed or []):
            product_counter[p] += 1
            
    top_products = []
    for prod, count in product_counter.most_common(6):
        pct = round((count / max(total_interactions, 1)) * 100.0, 1)
        top_products.append(ProductDiscussionMetric(product_name=prod, count=count, percentage=pct))

    # Timeline aggregation by date
    date_map = {}
    for i in interactions:
        dt = i.interaction_date
        if dt not in date_map:
            date_map[dt] = {"visits": 0, "calls": 0, "emails": 0}
        if i.interaction_type == "Visit":
            date_map[dt]["visits"] += 1
        elif i.interaction_type == "Phone":
            date_map[dt]["calls"] += 1
        else:
            date_map[dt]["emails"] += 1
            
    timeline = []
    for dt in sorted(date_map.keys())[-7:]:
        timeline.append(InteractionTimelineMetric(
            date=dt,
            visits=date_map[dt]["visits"],
            calls=date_map[dt]["calls"],
            emails=date_map[dt]["emails"]
        ))

    # Recent Agent execution logs
    recent_logs = db.query(AgentLog).order_by(AgentLog.created_at.desc()).limit(10).all()
    formatted_logs = []
    for log in recent_logs:
        formatted_logs.append({
            "id": log.id,
            "session_id": log.session_id,
            "step_name": log.step_name,
            "tool_name": log.tool_name,
            "execution_time_ms": log.execution_time_ms,
            "created_at": log.created_at.isoformat() if log.created_at else ""
        })

    return AnalyticsSummaryResponse(
        total_hcps=total_hcps,
        total_interactions=total_interactions,
        pending_followups=pending_followups,
        average_sentiment_score=avg_sentiment,
        high_priority_actions=high_priority,
        opportunity_index=avg_opportunity,
        sentiment_breakdown=SentimentBreakdown(Positive=pos_count, Neutral=neu_count, Negative=neg_count),
        top_products_discussed=top_products,
        interactions_timeline=timeline,
        recent_agent_logs=formatted_logs
    )
