from sqlalchemy import Column, DateTime, Float, Integer, String, func

from backend.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    total = Column(Float, nullable=False, default=0)
    items_count = Column(Integer, nullable=False, default=0)
    status = Column(String(30), nullable=False, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
