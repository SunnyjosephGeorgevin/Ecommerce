from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.order import Order
from backend.schemas.order import OrderCreate, OrderOut

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
    db.commit()
    db.refresh(order)
    return order
