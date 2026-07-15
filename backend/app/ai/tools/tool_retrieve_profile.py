from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.schema import HCP, Interaction
import re

def execute_retrieve_profile(message: str, db: Session, hcp_id: Optional[int] = None) -> Dict[str, Any]:
    """
    LangGraph Tool 3: Retrieve HCP Profile
    Returns past visits, products, preferences, prescription trends, and risk/opportunity metrics.
    """
    hcp = None
    if hcp_id:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    
    if not hcp:
        # Try finding doctor name in message
        match = re.search(r"(Dr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|Doctor\s+[A-Z][a-z]+)", message, re.IGNORECASE)
        if match:
            doc_name = match.group(0).replace("Doctor ", "Dr. ")
            hcp = db.query(HCP).filter(HCP.name.ilike(f"%{doc_name}%")).first()
        if not hcp:
            # Fallback to first HCP
            hcp = db.query(HCP).first()

    if not hcp:
        return {
            "status": "error",
            "tool_used": "tool_retrieve_profile",
            "summary": "No matching Healthcare Professional profile found."
        }

    past_interactions = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.interaction_date.desc()).all()
    
    products_count = {}
    sentiment_history = []
    visits_list = []
    
    for i in past_interactions:
        sentiment_history.append(i.sentiment)
        for p in (i.products_discussed or []):
            products_count[p] = products_count.get(p, 0) + 1
        visits_list.append({
            "id": i.id,
            "date": i.interaction_date,
            "type": i.interaction_type,
            "summary": i.ai_summary or i.notes,
            "sentiment": i.sentiment,
            "products": i.products_discussed
        })

    top_products = sorted(products_count.items(), key=lambda x: x[1], reverse=True)
    preferred_products = [item[0] for item in top_products[:3]] if top_products else ["MetfoPlus", "CardioGuard"]

    # Calculate simulated prescription trend based on recent sentiment & frequency
    trend = "Upward (+18% YoY)" if hcp.relationship_score > 75 else ("Stable" if hcp.relationship_score > 60 else "At Risk (-10% YoY)")

    return {
        "status": "success",
        "tool_used": "tool_retrieve_profile",
        "profile": {
            "id": hcp.id,
            "name": hcp.name,
            "hospital": hcp.hospital,
            "specialization": hcp.specialization,
            "tier": hcp.tier,
            "email": hcp.email,
            "phone": hcp.phone,
            "relationship_score": hcp.relationship_score,
            "risk_score": hcp.risk_score,
            "opportunity_score": hcp.opportunity_score,
            "prescription_trend": trend,
            "preferred_products": preferred_products,
            "total_visits_logged": len(visits_list),
            "past_visits": visits_list[:5]
        },
        "summary": f"Retrieved comprehensive profile for {hcp.name} ({hcp.hospital} - {hcp.specialization}). Tier: {hcp.tier}. Prescription Trend: {trend}. Relationship Score: {hcp.relationship_score}/100."
    }
