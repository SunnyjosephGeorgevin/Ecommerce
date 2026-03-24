from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user_behavior import UserBehavior
from backend.schemas.behavior import BehaviorEventCreate, BehaviorEventOut
from backend.services.realtime_pipeline import pipeline
from backend.utils.storage import build_export_object_name, get_storage_backend

router = APIRouter(prefix="/behavior", tags=["behavior"])


@router.post("/track", response_model=BehaviorEventOut)
def track_behavior(payload: BehaviorEventCreate, db: Session = Depends(get_db)):
    event = UserBehavior(
        user_id=payload.user_id,
        action=payload.action,
        query=payload.query,
        product_id=payload.product_id,
        score=payload.score,
        session_id=payload.session_id,
        context_json=payload.context_json,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    pipeline.publish(
        payload.user_id,
        payload.action,
        {
            "product_id": payload.product_id,
            "query": payload.query,
            "score": payload.score,
        },
    )

    return event


@router.get("/events")
def get_recent_events(user_id: int | None = None, limit: int = 30):
    bounded_limit = max(1, min(limit, 200))
    return {
        "events": pipeline.get_recent_events(user_id=user_id, limit=bounded_limit)
    }


@router.get("/dataset/export")
def export_behavior_dataset(db: Session = Depends(get_db)):
    rows = db.query(UserBehavior).order_by(UserBehavior.created_at.asc()).all()
    dataset = [
        {
            "id": row.id,
            "user_id": row.user_id,
            "action": row.action,
            "query": row.query,
            "product_id": row.product_id,
            "score": row.score,
            "session_id": row.session_id,
            "context_json": row.context_json,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]

    object_name = build_export_object_name("datasets/user_behavior")
    try:
        storage = get_storage_backend()
        location = storage.upload_json(object_name, dataset)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Dataset export storage unavailable: {exc}",
        ) from exc

    return {
        "records": len(dataset),
        "location": location,
        "object_name": object_name,
    }
