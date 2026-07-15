from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.schema import Product
from app.schemas.product import ProductResponse

router = APIRouter()

@router.get("/products", response_model=List[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    """
    GET /products
    Returns all pharmaceutical / medical products available for discussion and sampling.
    """
    return db.query(Product).order_by(Product.name.asc()).all()
