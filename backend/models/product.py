from sqlalchemy import Column, DateTime, Float, Integer, String, func

from backend.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Float, nullable=False)
    description = Column(String(2000), nullable=False)
    image_url = Column(String(2048), nullable=False)
    category = Column(String(120), nullable=False, index=True)
    stock = Column(Integer, nullable=False, default=0)
    seller_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
