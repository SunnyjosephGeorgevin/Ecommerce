from pydantic import BaseModel

from backend.schemas.product import ProductOut


class RecommendationResponse(BaseModel):
    user_id: int
    version: int
    strategy: str
    recommendations: list[ProductOut]
