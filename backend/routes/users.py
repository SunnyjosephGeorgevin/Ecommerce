from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User
from backend.schemas.user import UserOut

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/admin/users/{user_id}/approve", response_model=UserOut)
def approve_buyer_user(
    user_id: int,
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    if not x_admin_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing admin identity")

    admin_user = db.query(User).filter(User.email == x_admin_email).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.role != "buyer":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only buyers require approval")

    user.is_approved = True
    db.commit()
    db.refresh(user)
    return user
