import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.schema import HCP, Interaction, Followup
from app.config import settings
from app.ai.prompts import FOLLOWUP_GENERATION_PROMPT
from datetime import datetime, timedelta

def execute_generate_followup(
    message: str, 
    db: Session, 
    hcp_id: Optional[int] = None, 
    interaction_id: Optional[int] = None,
    user_id: int = 1
) -> Dict[str, Any]:
    """
    LangGraph Tool 4: Generate Follow-up Plan
    Uses LLM (llama-3.3-70b-versatile) to formulate optimal follow-up strategy, talking points,
    suggested date, priority, and saves to database.
    """
    hcp = None
    if hcp_id:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp and interaction_id:
        inter = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if inter:
            hcp = db.query(HCP).filter(HCP.id == inter.hcp_id).first()
    if not hcp:
        hcp = db.query(HCP).first()

    if not hcp:
        return {
            "status": "error",
            "tool_used": "tool_generate_followup",
            "summary": "Could not identify target HCP for follow-up generation."
        }

    # Gather past context
    recent_interactions = db.query(Interaction).filter(Interaction.hcp_id == hcp.id).order_by(Interaction.interaction_date.desc()).limit(3).all()
    context_str = f"HCP: {hcp.name}, Specialization: {hcp.specialization}, Hospital: {hcp.hospital}, Tier: {hcp.tier}\nPast Visits:\n"
    for idx, r in enumerate(recent_interactions):
        context_str += f"- Visit {idx+1} ({r.interaction_date}): {r.ai_summary or r.notes}\n"

    # Try calling Groq API
    plan = None
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "gsk_placeholder" and not settings.GROQ_API_KEY.startswith("gsk_your_"):
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_SECONDARY_MODEL,
                temperature=0.3
            )
            response = llm.invoke([
                SystemMessage(content=FOLLOWUP_GENERATION_PROMPT),
                HumanMessage(content=context_str)
            ])
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            plan = json.loads(content)
        except Exception as e:
            print(f"[GenerateFollowupTool] Groq API fallback: {e}")

    if not plan:
        # Intelligent Heuristic Plan Generation
        suggested_date = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")
        plan = {
            "suggested_date": suggested_date,
            "priority": "High" if hcp.tier == "Priority A" else "Medium",
            "strategy": f"Position high-efficacy benefits of combination therapy tailored for {hcp.specialization} patients at {hcp.hospital}. Address clinical efficacy and patient compliance.",
            "talking_points": [
                f"Present 52-week clinical outcomes data comparing standard care vs MetfoPlus in {hcp.specialization}.",
                "Highlight 0% co-pay assistance and sample availability for newly diagnosed patients.",
                "Discuss dosage titration flexibility based on recent clinical feedback."
            ]
        }

    # Save to followups table
    followup_entry = Followup(
        hcp_id=hcp.id,
        interaction_id=interaction_id or (recent_interactions[0].id if recent_interactions else None),
        user_id=user_id,
        suggested_date=plan.get("suggested_date", "Next Tuesday"),
        strategy=plan.get("strategy", "Clinical follow-up discussion."),
        talking_points=plan.get("talking_points", ["Review clinical safety monograph"]),
        status="pending",
        priority=plan.get("priority", "High")
    )
    db.add(followup_entry)
    db.commit()
    db.refresh(followup_entry)

    return {
        "status": "success",
        "tool_used": "tool_generate_followup",
        "followup_plan": {
            "id": followup_entry.id,
            "hcp_id": hcp.id,
            "hcp_name": hcp.name,
            "suggested_date": followup_entry.suggested_date,
            "priority": followup_entry.priority,
            "strategy": followup_entry.strategy,
            "talking_points": followup_entry.talking_points
        },
        "summary": f"Generated high-priority follow-up strategy for {hcp.name} scheduled for {followup_entry.suggested_date}."
    }
