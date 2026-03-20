from datetime import datetime

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str
    price: float = Field(gt=0)
    description: str
    image_url: str
    category: str
    stock: int = Field(ge=0)
    seller_id: int


class ProductOut(BaseModel):
    id: int
    name: str
    price: float
    description: str
    image_url: str
    category: str
    stock: int
    seller_id: int
    created_at: datetime

    class Config:
        from_attributes = True
