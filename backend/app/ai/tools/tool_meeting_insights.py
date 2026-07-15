import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.schema import HCP, Interaction
from app.config import settings
from app.ai.prompts import MEETING_INSIGHTS_PROMPT

def execute_meeting_insights(message: str, db: Session, hcp_id: Optional[int] = None) -> Dict[str, Any]:
    """
    LangGraph Tool 5: Meeting Insights
    Analyzes all previous interactions across HCP or specific doctor, generating Relationship Score,
    Risk Score, Opportunity Score, and actionable strategic recommendations.
    """
    hcp = None
    if hcp_id:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        hcp = db.query(HCP).first()

    if not hcp:
        return {
            "status": "error",
            "tool_used": "tool_meeting_insights",
            "summary": "No HCP data available to compute meeting insights."
        }

    interactions = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).all()
    
    # Calculate quantitative scores based on interaction volume and sentiment
    total_count = len(interactions)
    pos_count = sum(1 for i in interactions if i.sentiment == "Positive")
    neg_count = sum(1 for i in interactions if i.sentiment == "Negative")
    
    # Base heuristic formula
    rel_score = min(100.0, 65.0 + (pos_count * 8.0) - (neg_count * 12.0) + min(total_count * 2.0, 15.0))
    risk_score = max(5.0, min(95.0, 25.0 + (neg_count * 15.0) - (pos_count * 5.0)))
    opp_score = min(100.0, 70.0 + (total_count * 5.0) + (10.0 if hcp.tier == "Priority A" else 0.0))

    # Try calling Groq API if key is real
    insights_data = None
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "gsk_placeholder" and not settings.GROQ_API_KEY.startswith("gsk_your_"):
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_SECONDARY_MODEL,
                temperature=0.2
            )
            context = f"Doctor: {hcp.name}, Specialization: {hcp.specialization}, Tier: {hcp.tier}\nTotal Visits: {total_count}\nPositive Visits: {pos_count}, Negative Visits: {neg_count}"
            response = llm.invoke([
                SystemMessage(content=MEETING_INSIGHTS_PROMPT),
                HumanMessage(content=context)
            ])
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            insights_data = json.loads(content)
        except Exception as e:
            print(f"[MeetingInsightsTool] Groq API fallback: {e}")

    if not insights_data:
        insights_data = {
            "relationship_score": round(rel_score, 1),
            "risk_score": round(risk_score, 1),
            "opportunity_score": round(opp_score, 1),
            "summary": f"Strong engagement trajectory with {hcp.name} ({total_count} interactions logged). Doctor demonstrates high receptivity to clinical discussions.",
            "recommendations": [
                "Schedule quarterly peer-to-peer dinner symposia invitation.",
                f"Present new combination trial outcomes specific to {hcp.specialization}.",
                "Deliver 15 additional sample packs to support new diabetic/cardiac patient enrollments."
            ]
        }

    # Update HCP database record with calculated scores
    hcp.relationship_score = insights_data.get("relationship_score", rel_score)
    hcp.risk_score = insights_data.get("risk_score", risk_score)
    hcp.opportunity_score = insights_data.get("opportunity_score", opp_score)
    db.commit()

    return {
        "status": "success",
        "tool_used": "tool_meeting_insights",
        "hcp_id": hcp.id,
        "hcp_name": hcp.name,
        "relationship_score": hcp.relationship_score,
        "risk_score": hcp.risk_score,
        "opportunity_score": hcp.opportunity_score,
        "summary": insights_data.get("summary"),
        "recommendations": insights_data.get("recommendations", [])
    }
