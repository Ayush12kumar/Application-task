import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.schema import Interaction, InteractionHistory, HCP
from datetime import datetime

def execute_edit_interaction(
    message: str, 
    db: Session, 
    interaction_id: Optional[int] = None, 
    user_id: int = 1
) -> Dict[str, Any]:
    """
    LangGraph Tool 2: Edit Interaction
    Fetches interaction by ID or most recent record, modifies fields according to user intent/patch,
    and logs immutable version history.
    """
    target = None
    if interaction_id:
        target = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    
    if not target:
        # Find most recent interaction logged by this user
        target = db.query(Interaction).filter(Interaction.user_id == user_id).order_by(Interaction.updated_at.desc()).first()
    
    if not target:
        return {
            "status": "error",
            "tool_used": "tool_edit_interaction",
            "summary": "No active interaction found to edit. Please log an interaction first."
        }

    # Save previous state to InteractionHistory before modifying
    previous_snapshot = {
        "interaction_date": target.interaction_date,
        "interaction_type": target.interaction_type,
        "duration_minutes": target.duration_minutes,
        "discussion_topics": target.discussion_topics,
        "products_discussed": target.products_discussed,
        "samples_given": target.samples_given,
        "follow_up_required": target.follow_up_required,
        "follow_up_date": target.follow_up_date,
        "notes": target.notes,
        "ai_summary": target.ai_summary,
        "sentiment": target.sentiment,
        "priority": target.priority,
        "next_action": target.next_action,
        "status": target.status
    }
    
    history_entry = InteractionHistory(
        interaction_id=target.id,
        version=target.version,
        changed_by_user_id=user_id,
        previous_data=previous_snapshot,
        changed_at=datetime.utcnow()
    )
    db.add(history_entry)

    # Apply intelligent modifications based on natural language message
    msg_lower = message.lower()
    changes_made = []
    
    if "follow-up date" in msg_lower or "follow up date" in msg_lower or "reschedule" in msg_lower:
        # Extract new date string
        if "friday" in msg_lower:
            target.follow_up_date = "Next Friday"
            changes_made.append("Follow-up date changed to Next Friday")
        elif "monday" in msg_lower:
            target.follow_up_date = "Next Monday"
            changes_made.append("Follow-up date changed to Next Monday")
        else:
            target.follow_up_date = "Updated via AI prompt"
            changes_made.append("Follow-up date updated")
        target.follow_up_required = True

    if "sentiment" in msg_lower:
        if "positive" in msg_lower:
            target.sentiment = "Positive"
            changes_made.append("Sentiment updated to Positive")
        elif "negative" in msg_lower:
            target.sentiment = "Negative"
            changes_made.append("Sentiment updated to Negative")
        elif "neutral" in msg_lower:
            target.sentiment = "Neutral"
            changes_made.append("Sentiment updated to Neutral")

    if "add product" in msg_lower or "discussed" in msg_lower or "add" in msg_lower:
        for p in ["MetfoPlus", "CardioGuard", "OncoShield", "GlucoPrime", "VeloHeart"]:
            if p.lower() in msg_lower and p not in (target.products_discussed or []):
                new_prods = list(target.products_discussed or [])
                new_prods.append(p)
                target.products_discussed = new_prods
                changes_made.append(f"Added product {p} to discussion")

    if "priority" in msg_lower:
        if "high" in msg_lower:
            target.priority = "High"
            changes_made.append("Priority changed to High")
        elif "low" in msg_lower:
            target.priority = "Low"
            changes_made.append("Priority changed to Low")

    if not changes_made:
        # Append note if general update
        target.notes = f"{target.notes}\n[AI Update Note]: {message}"
        changes_made.append("Added supplementary notes")

    target.version += 1
    target.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(target)

    hcp = db.query(HCP).filter(HCP.id == target.hcp_id).first()

    return {
        "status": "success",
        "tool_used": "tool_edit_interaction",
        "interaction_id": target.id,
        "version": target.version,
        "changes_made": changes_made,
        "extracted_preview": {
            "hcp_id": target.hcp_id,
            "hcp_name": hcp.name if hcp else "Doctor",
            "hospital": hcp.hospital if hcp else "Hospital",
            "specialization": hcp.specialization if hcp else "General Practice",
            "interaction_date": target.interaction_date,
            "interaction_type": target.interaction_type,
            "products_discussed": target.products_discussed,
            "samples_given": target.samples_given,
            "follow_up_required": target.follow_up_required,
            "follow_up_date": target.follow_up_date,
            "notes": target.notes,
            "ai_summary": target.ai_summary,
            "sentiment": target.sentiment,
            "priority": target.priority,
            "next_action": target.next_action,
            "confidence_score": target.confidence_score
        },
        "summary": f"Successfully edited Interaction #{target.id} (Version {target.version}). Changes: {', '.join(changes_made)}."
    }
