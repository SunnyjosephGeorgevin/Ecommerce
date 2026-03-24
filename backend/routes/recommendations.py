from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.recommendation import RecommendationResponse
from backend.services.realtime_pipeline import pipeline
from backend.services.recommendation_engine import get_hybrid_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _serialize_products(products):
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "description": p.description,
            "image_url": p.image_url,
            "category": p.category,
            "stock": p.stock,
            "seller_id": p.seller_id,
            "created_at": p.created_at,
        }
        for p in products
    ]


@router.get("/hybrid/{user_id}", response_model=RecommendationResponse)
def get_hybrid(user_id: int, limit: int = 8, db: Session = Depends(get_db)):
    bounded_limit = max(1, min(limit, 20))
    products = get_hybrid_recommendations(db, user_id=user_id, limit=bounded_limit)
    return {
        "user_id": user_id,
        "version": pipeline.get_version(user_id),
        "strategy": "hybrid-collaborative-content",
        "recommendations": _serialize_products(products),
    }


@router.get("/realtime/{user_id}", response_model=RecommendationResponse)
def get_realtime(user_id: int, limit: int = 8, db: Session = Depends(get_db)):
    bounded_limit = max(1, min(limit, 20))
    products = get_hybrid_recommendations(db, user_id=user_id, limit=bounded_limit)
    return {
        "user_id": user_id,
        "version": pipeline.get_version(user_id),
        "strategy": "realtime-hybrid",
        "recommendations": _serialize_products(products),
    }
