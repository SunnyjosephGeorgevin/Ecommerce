from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.product import Product
from backend.models.user import User
from backend.schemas.product import ProductOut

router = APIRouter(prefix="/seller", tags=["seller"])


@router.get("/products", response_model=list[ProductOut])
def get_seller_products(seller_id: int = Query(...), db: Session = Depends(get_db)):
    seller = db.query(User).filter(User.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller user not found")
    if seller.role != "seller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a seller")

    return (
        db.query(Product)
        .filter(Product.seller_id == seller_id)
        .order_by(Product.created_at.desc())
        .all()
    )
