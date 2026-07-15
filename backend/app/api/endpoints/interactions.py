from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.schema import Interaction, InteractionHistory, HCP
from app.schemas.interaction import InteractionCreate, InteractionUpdate, InteractionResponse, InteractionListResponse

router = APIRouter()

@router.post("/interaction", response_model=InteractionResponse, status_code=201)
def create_interaction(data: InteractionCreate, db: Session = Depends(get_db)):
    """
    POST /interaction
    Logs a new structured interaction with an HCP.
    """
    hcp = db.query(HCP).filter(HCP.id == data.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="Target Healthcare Professional not found")

    interaction = Interaction(
        hcp_id=data.hcp_id,
        user_id=data.user_id,
        interaction_date=data.interaction_date,
        interaction_type=data.interaction_type,
        duration_minutes=data.duration_minutes,
        discussion_topics=data.discussion_topics,
        products_discussed=data.products_discussed,
        samples_given=data.samples_given,
        follow_up_required=data.follow_up_required,
        follow_up_date=data.follow_up_date,
        notes=data.notes,
        ai_summary=data.ai_summary or f"Interaction logged with {hcp.name} discussing {', '.join(data.products_discussed) if data.products_discussed else 'portfolio'}.",
        sentiment=data.sentiment,
        priority=data.priority,
        next_action=data.next_action or "Monitor clinical adoption and follow up as scheduled.",
        confidence_score=data.confidence_score,
        status=data.status,
        version=1
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.put("/interaction/{id}", response_model=InteractionResponse)
def update_interaction(id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    """
    PUT /interaction/{id}
    Updates existing interaction and records immutable version history in `interaction_history`.
    """
    target = db.query(Interaction).filter(Interaction.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Interaction record not found")

    # Snapshot previous state
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

    history = InteractionHistory(
        interaction_id=target.id,
        version=target.version,
        changed_by_user_id=target.user_id,
        previous_data=previous_snapshot,
        changed_at=datetime.utcnow()
    )
    db.add(history)

    update_dict = data.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(target, key, val)

    target.version += 1
    target.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(target)
    return target


@router.get("/interaction/{id}", response_model=InteractionResponse)
def get_interaction(id: int, db: Session = Depends(get_db)):
    """
    GET /interaction/{id}
    Retrieves full interaction details along with version history and HCP profile.
    """
    target = db.query(Interaction).filter(Interaction.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Interaction record not found")
    return target


@router.get("/interactions", response_model=InteractionListResponse)
def list_interactions(
    search: Optional[str] = Query(None, description="Search by notes or topics"),
    hcp_id: Optional[int] = Query(None),
    interaction_type: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    GET /interactions
    List interactions with pagination and filtering.
    """
    query = db.query(Interaction)
    if hcp_id:
        query = query.filter(Interaction.hcp_id == hcp_id)
    if interaction_type:
        query = query.filter(Interaction.interaction_type == interaction_type)
    if sentiment:
        query = query.filter(Interaction.sentiment == sentiment)
    if search:
        query = query.filter(
            (Interaction.notes.ilike(f"%{search}%")) |
            (Interaction.discussion_topics.ilike(f"%{search}%")) |
            (Interaction.ai_summary.ilike(f"%{search}%"))
        )

    total = query.count()
    items = query.order_by(Interaction.interaction_date.desc(), Interaction.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}
