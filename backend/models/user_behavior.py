from sqlalchemy import Column, DateTime, Float, Integer, String, Text, func
from backend.database import Base


class UserBehavior(Base):
    __tablename__ = "user_behavior"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    action = Column(String(40), index=True)  # "search", "click", "purchase", "feedback"
    query = Column(String(500), nullable=True)
    product_id = Column(Integer, nullable=True)
    score = Column(Float, nullable=False, default=1.0)
    session_id = Column(String(120), nullable=True)
    context_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())