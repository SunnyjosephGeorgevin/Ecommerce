from datetime import datetime

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    user_id: int
    total: float = Field(ge=0)
    items_count: int = Field(ge=0)
    status: str = "pending"


class OrderOut(BaseModel):
    id: int
    user_id: int
    total: float
    items_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
