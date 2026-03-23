from sqlalchemy import Column, Integer, String, DateTime, func
from backend.database import Base

class UserBehavior(Base):
    __tablename__ = "user_behavior"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    action = Column(String)  # "search", "click"
    query = Column(String, nullable=True)
    product_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())