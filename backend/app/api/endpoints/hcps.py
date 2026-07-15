from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.schema import HCP, Interaction, Followup
from app.schemas.hcp import HCPCreate, HCPUpdate, HCPResponse, HCPSearchResult

router = APIRouter()

@router.get("/hcp", response_model=HCPSearchResult)
@router.get("/hcps", response_model=HCPSearchResult)
def list_hcps(
    search: Optional[str] = Query(None, description="Search by name, hospital, or specialization"),
    specialization: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    GET /hcp & /hcps
    Retrieve paginated list of Healthcare Professionals with filters.
    """
    query = db.query(HCP)
    if specialization:
        query = query.filter(HCP.specialization.ilike(f"%{specialization}%"))
    if tier:
        query = query.filter(HCP.tier == tier)
    if search:
        query = query.filter(
            (HCP.name.ilike(f"%{search}%")) |
            (HCP.hospital.ilike(f"%{search}%")) |
            (HCP.specialization.ilike(f"%{search}%"))
        )

    total = query.count()
    items = query.order_by(HCP.name.asc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.get("/hcp/{id}", response_model=HCPResponse)
@router.get("/hcps/{id}", response_model=HCPResponse)
def get_hcp(id: int, db: Session = Depends(get_db)):
    """
    GET /hcp/{id} & /hcps/{id}
    Retrieves detailed 360-degree profile of an HCP including AI scores.
    """
    target = db.query(HCP).filter(HCP.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Healthcare Professional not found")
    return target


@router.post("/hcp", response_model=HCPResponse, status_code=201)
@router.post("/hcps", response_model=HCPResponse, status_code=201)
def create_hcp(data: HCPCreate, db: Session = Depends(get_db)):
    """
    POST /hcp & /hcps
    Registers a new Healthcare Professional.
    """
    hcp = HCP(**data.model_dump())
    db.add(hcp)
    db.commit()
    db.refresh(hcp)
    return hcp


@router.put("/hcp/{id}", response_model=HCPResponse)
@router.put("/hcps/{id}", response_model=HCPResponse)
def update_hcp(id: int, data: HCPUpdate, db: Session = Depends(get_db)):
    """
    PUT /hcp/{id} & /hcps/{id}
    Updates an existing HCP profile.
    """
    target = db.query(HCP).filter(HCP.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Healthcare Professional not found")
    
    update_dict = data.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(target, key, val)
        
    db.commit()
    db.refresh(target)
    return target
