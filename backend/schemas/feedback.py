from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    user_id: int
    product_id: int | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    source: str = "app"


class FeedbackOut(BaseModel):
    id: int
    user_id: int
    product_id: int | None
    rating: int
    comment: str | None
    source: str
    created_at: datetime

    class Config:
        from_attributes = True
