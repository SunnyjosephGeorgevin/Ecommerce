import base64
import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User
from backend.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from backend.schemas.user import UserOut

router = APIRouter(tags=["auth"])

_SECRET = os.getenv("AUTH_SECRET", "dev-secret")


def hash_password(password: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), _SECRET.encode("utf-8"), 120000)
    return base64.b64encode(digest).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    calculated = hash_password(password)
    return hmac.compare_digest(calculated, password_hash)


def create_token(user: User) -> str:
    payload = f"{user.id}:{user.role}:{user.email}"
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if payload.role not in {"buyer", "seller"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=payload.role,
        is_approved=(payload.role == "seller"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.role == "buyer" and not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyer account pending admin approval",
        )

    token = create_token(user)
    return LoginResponse(access_token=token, user=user)
