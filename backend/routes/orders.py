from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.order import Order
from backend.models.user_behavior import UserBehavior
from backend.schemas.order import OrderCreate, OrderOut
from backend.services.realtime_pipeline import pipeline

router = APIRouter(tags=["orders"])


@router.get("/orders", response_model=list[OrderOut])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    order = Order(
        user_id=payload.user_id,
        total=payload.total,
        items_count=payload.items_count,
        status=payload.status,
    )
    db.add(order)

    db.add(
        UserBehavior(
            user_id=payload.user_id,
            action="purchase",
            query=f"order_total_{payload.total}",
            score=1 + min(payload.items_count, 10) / 10,
        )
    )

    db.commit()
    db.refresh(order)

    pipeline.publish(
        payload.user_id,
        "purchase",
        {
            "order_id": order.id,
            "items_count": payload.items_count,
            "total": payload.total,
        },
    )

    return order
