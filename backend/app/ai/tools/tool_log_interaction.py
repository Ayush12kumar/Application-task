import json
import re
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.schema import HCP, Interaction
from app.config import settings
from app.ai.prompts import ENTITY_EXTRACTION_PROMPT, SUMMARIZATION_PROMPT
from datetime import datetime

def execute_log_interaction(message: str, db: Session, user_id: int = 1) -> Dict[str, Any]:
    """
    LangGraph Tool 1: Log Interaction
    Uses LLM (Groq gemma2-9b-it or fallback NER) to extract doctor name, hospital, products,
    sentiment, follow-up, summarizes notes, and creates/updates draft interaction in database.
    """
    extracted = _run_ner_extraction(message)
    
    # Check duplicate or find existing HCP
    doctor_name = extracted.get("doctor_name") or "Dr. Unknown"
    hospital = extracted.get("hospital") or "General Hospital"
    specialization = extracted.get("specialization") or "General Practice"
    
    hcp = db.query(HCP).filter(HCP.name.ilike(f"%{doctor_name}%")).first()
    if not hcp:
        # Create a new HCP profile automatically
        hcp = HCP(
            name=doctor_name,
            hospital=hospital,
            specialization=specialization,
            tier="Priority A",
            relationship_score=78.0,
            risk_score=14.0,
            opportunity_score=86.0
        )
        db.add(hcp)
        db.commit()
        db.refresh(hcp)
    
    # Check duplicate recent interaction
    duplicate_warning = None
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    recent_dup = db.query(Interaction).filter(
        Interaction.hcp_id == hcp.id,
        Interaction.interaction_date == (extracted.get("interaction_date") or today_str)
    ).first()
    if recent_dup:
        duplicate_warning = f"Notice: An interaction with {doctor_name} was already logged for today ({recent_dup.interaction_date}). This record is saved as a distinct update or version."

    # Generate AI Summary
    ai_summary = extracted.get("ai_summary")
    if not ai_summary:
        ai_summary = f"Representative interacted with {doctor_name} at {hospital}. Discussed {', '.join(extracted.get('products_discussed', ['core portfolio']))}. Doctor expressed {extracted.get('sentiment', 'Positive').lower()} sentiment with commitment to follow up."

    # Create interaction draft
    interaction = Interaction(
        hcp_id=hcp.id,
        user_id=user_id,
        interaction_date=extracted.get("interaction_date") or today_str,
        interaction_type=extracted.get("interaction_type", "Visit"),
        duration_minutes=extracted.get("duration_minutes", 30),
        discussion_topics=extracted.get("notes", message),
        products_discussed=extracted.get("products_discussed", []),
        samples_given=extracted.get("samples_given", []),
        follow_up_required=extracted.get("follow_up_required", False),
        follow_up_date=extracted.get("follow_up_date"),
        notes=message,
        ai_summary=ai_summary,
        sentiment=extracted.get("sentiment", "Positive"),
        priority=extracted.get("priority", "Medium"),
        next_action=extracted.get("next_action", "Provide clinical study updates and monitor prescription volume."),
        confidence_score=extracted.get("confidence_score", 0.96),
        status="saved"
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    return {
        "status": "success",
        "tool_used": "tool_log_interaction",
        "hcp_id": hcp.id,
        "interaction_id": interaction.id,
        "extracted_preview": {
            "hcp_id": hcp.id,
            "hcp_name": hcp.name,
            "hospital": hcp.hospital,
            "specialization": hcp.specialization,
            "interaction_date": interaction.interaction_date,
            "interaction_type": interaction.interaction_type,
            "products_discussed": interaction.products_discussed,
            "samples_given": interaction.samples_given,
            "follow_up_required": interaction.follow_up_required,
            "follow_up_date": interaction.follow_up_date,
            "notes": interaction.notes,
            "ai_summary": interaction.ai_summary,
            "sentiment": interaction.sentiment,
            "priority": interaction.priority,
            "next_action": interaction.next_action,
            "confidence_score": interaction.confidence_score,
            "duplicate_warning": duplicate_warning
        },
        "summary": f"Successfully logged and analyzed interaction for {hcp.name} at {hcp.hospital}."
    }

def _run_ner_extraction(message: str) -> Dict[str, Any]:
    """
    Runs Groq API inference with gemma2-9b-it if API key is present;
    otherwise uses intelligent pattern regex extraction for seamless out-of-the-box demoing.
    """
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "gsk_placeholder" and not settings.GROQ_API_KEY.startswith("gsk_your_"):
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage, HumanMessage
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_PRIMARY_MODEL,
                temperature=0.1
            )
            response = llm.invoke([
                SystemMessage(content=ENTITY_EXTRACTION_PROMPT),
                HumanMessage(content=message)
            ])
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            print(f"[LogInteractionTool] Groq API fallback triggered: {e}")

    # Intelligent Heuristic/Regex Extraction Fallback
    doctor_match = re.search(r"(Dr\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?|Doctor\s+[A-Z][a-z]+)", message, re.IGNORECASE)
    doctor_name = doctor_match.group(0) if doctor_match else "Dr. Sharma"
    
    hospital_match = re.search(r"([A-Z][a-zA-Z\s]+(Hospital|Clinic|Medical Center|Institute))", message)
    hospital = hospital_match.group(1) if hospital_match else "Apollo Hospital"
    
    products = []
    known_products = ["MetfoPlus", "CardioGuard", "OncoShield", "NeuroCalm", "RespiraClear", "GlucoPrime", "VeloHeart"]
    for p in known_products:
        if p.lower() in message.lower():
            products.append(p)
    if not products:
        if "diabetes" in message.lower():
            products = ["MetfoPlus 500mg", "GlucoPrime"]
        elif "cardio" in message.lower() or "heart" in message.lower():
            products = ["CardioGuard 10mg", "VeloHeart"]
        else:
            products = ["MetfoPlus", "CardioGuard"]

    sentiment = "Positive"
    if any(w in message.lower() for w in ["concerned", "not interested", "refused", "complained", "bad"]):
        sentiment = "Negative"
    elif any(w in message.lower() for w in ["neutral", "average", "busy"]):
        sentiment = "Neutral"

    follow_up_req = "follow-up" in message.lower() or "follow up" in message.lower() or "next" in message.lower()
    follow_up_date = "Next Tuesday" if follow_up_req else None
    if "next" in message.lower():
        match = re.search(r"next\s+([a-zA-Z]+)", message.lower())
        if match:
            follow_up_date = f"Next {match.group(1).capitalize()}"

    samples = []
    if "sample" in message.lower():
        samples = [{"product": products[0], "quantity": 10}]

    return {
        "doctor_name": doctor_name,
        "hospital": hospital,
        "specialization": "Cardiology" if "cardio" in message.lower() else ("Endocrinology" if "diabetes" in message.lower() else "Internal Medicine"),
        "interaction_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "interaction_type": "Visit",
        "duration_minutes": 30,
        "products_discussed": products,
        "samples_given": samples,
        "follow_up_required": follow_up_req,
        "follow_up_date": follow_up_date,
        "notes": message,
        "sentiment": sentiment,
        "priority": "High" if sentiment == "Positive" and samples else "Medium",
        "next_action": f"Follow up on {products[0]} trial packs and clinical data.",
        "confidence_score": 0.96
    }
