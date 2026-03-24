from datetime import datetime

from pydantic import BaseModel, Field


class BehaviorEventCreate(BaseModel):
    user_id: int
    action: str = Field(min_length=2, max_length=40)
    query: str | None = None
    product_id: int | None = None
    score: float = Field(default=1.0, ge=0)
    session_id: str | None = None
    context_json: str | None = None


class BehaviorEventOut(BaseModel):
    id: int
    user_id: int
    action: str
    query: str | None
    product_id: int | None
    score: float
    session_id: str | None
    context_json: str | None
    created_at: datetime

    class Config:
        from_attributes = True
