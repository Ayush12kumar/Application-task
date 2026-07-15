from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.schema import Followup, HCP, Interaction
from app.schemas.followup import FollowupCreate, FollowupResponse
from app.ai.tools.tool_generate_followup import execute_generate_followup

router = APIRouter()

@router.post("/followup", response_model=FollowupResponse, status_code=201)
def create_followup(data: FollowupCreate, db: Session = Depends(get_db)):
    """
    POST /followup
    Creates or triggers AI follow-up strategy generation for an HCP.
    """
    hcp = db.query(HCP).filter(HCP.id == data.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    if not data.strategy or data.strategy == "auto":
        # Run AI tool to generate strategy automatically
        res = execute_generate_followup(f"Generate follow-up for {hcp.name}", db, data.hcp_id, data.interaction_id, data.user_id)
        fp_data = res.get("followup_plan", {})
        followup = db.query(Followup).filter(Followup.id == fp_data.get("id")).first()
        if followup:
            return followup

    followup = Followup(**data.model_dump())
    db.add(followup)
    db.commit()
    db.refresh(followup)
    return followup


@router.get("/followup", response_model=List[FollowupResponse])
@router.get("/followups", response_model=List[FollowupResponse])
def list_followups(
    hcp_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    GET /followups
    Retrieves scheduled follow-up strategies.
    """
    query = db.query(Followup)
    if hcp_id:
        query = query.filter(Followup.hcp_id == hcp_id)
    if status:
        query = query.filter(Followup.status == status)
    return query.order_by(Followup.suggested_date.asc()).all()
