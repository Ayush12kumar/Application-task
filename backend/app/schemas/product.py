from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class ProductBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    indications: Optional[str] = None
    dosage: Optional[str] = None
    sample_available: bool = True

class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
