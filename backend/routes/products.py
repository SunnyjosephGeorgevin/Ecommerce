from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.product import Product
from backend.models.user import User
from backend.schemas.product import ProductCreate, ProductOut

router = APIRouter(tags=["products"])


CATEGORY_ALIASES = {
    "footwear": ["footwear", "sneakers"],
    "fashion": ["fashion", "apparel"],
}


@router.get("/products", response_model=list[ProductOut])
def get_products(category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Product)

    if category:
        normalized_category = category.strip().lower()
        mapped_categories = CATEGORY_ALIASES.get(normalized_category)
        if mapped_categories:
            query = query.filter(Product.category.in_(mapped_categories))
        else:
            query = query.filter(Product.category == normalized_category)

    return query.order_by(Product.created_at.desc()).all()


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    seller = db.query(User).filter(User.id == payload.seller_id).first()
    if not seller:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller user not found")
    if seller.role != "seller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a seller")

    product = Product(
        name=payload.name,
        price=payload.price,
        description=payload.description,
        image_url=payload.image_url,
        category=payload.category,
        stock=payload.stock,
        seller_id=payload.seller_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
