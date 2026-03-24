from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.feedback import Feedback
from backend.models.user_behavior import UserBehavior
from backend.schemas.feedback import FeedbackCreate, FeedbackOut
from backend.services.realtime_pipeline import pipeline

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    feedback = Feedback(
        user_id=payload.user_id,
        product_id=payload.product_id,
        rating=payload.rating,
        comment=payload.comment,
        source=payload.source,
    )
    db.add(feedback)

    db.add(
        UserBehavior(
            user_id=payload.user_id,
            action="feedback",
            product_id=payload.product_id,
            score=float(payload.rating) / 5,
            query=payload.comment,
        )
    )

    db.commit()
    db.refresh(feedback)

    pipeline.publish(
        payload.user_id,
        "feedback",
        {"product_id": payload.product_id, "rating": payload.rating},
    )

    return feedback


@router.get("", response_model=list[FeedbackOut])
def list_feedback(
    user_id: int | None = None,
    product_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Feedback)
    if user_id is not None:
        query = query.filter(Feedback.user_id == user_id)
    if product_id is not None:
        query = query.filter(Feedback.product_id == product_id)

    return query.order_by(Feedback.created_at.desc()).all()


@router.get("/summary")
def feedback_summary(product_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(
        func.count(Feedback.id).label("count"),
        func.avg(Feedback.rating).label("avg_rating"),
    )
    if product_id is not None:
        query = query.filter(Feedback.product_id == product_id)

    summary = query.one()
    return {
        "count": int(summary.count or 0),
        "avg_rating": float(summary.avg_rating or 0),
        "product_id": product_id,
    }
