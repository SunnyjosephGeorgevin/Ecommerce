import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

# Allow imports like backend.database even when running from backend/ as cwd.
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database import Base, SessionLocal, engine
from backend.models.user import User
from backend.routes.auth import hash_password
from backend.routes.auth import router as auth_router
from backend.routes.orders import router as orders_router
from backend.routes.products import router as products_router
from backend.routes.seller import router as seller_router
from backend.routes.users import router as users_router

from backend.routes.agent import router as agent_router

from backend.models.user_behavior import UserBehavior

# ✅ Create tables
Base.metadata.create_all(bind=engine)


# 🔧 Ensure schema updates safely
def ensure_schema() -> None:
    db: Session = SessionLocal()
    try:
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]

        if "is_approved" not in columns:
            db.execute(
                text(
                    "ALTER TABLE users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT 1"
                )
            )
            db.commit()
    finally:
        db.close()



# 🔥 SAFE SEEDING (NO DUPLICATES)
def seed_defaults() -> None:
    db: Session = SessionLocal()
    try:
        # 👉 Run ONLY if DB is empty (best practice)
        if db.query(User).count() == 0:

            db.add_all([
                User(
                    name="Demo Seller",
                    email="seller@demo.com",
                    password=hash_password("demo-password-123"),
                    role="seller",
                    is_approved=True,
                ),
                User(
                    name="Demo Buyer",
                    email="buyer@demo.com",
                    password=hash_password("demo-password-123"),
                    role="buyer",
                    is_approved=True,
                ),
                User(
                    name="Demo Admin",
                    email="admin@demo.com",
                    password=hash_password("demo-password-123"),
                    role="admin",
                    is_approved=True,
                ),
            ])

            db.commit()

    finally:
        db.close()


# Run setup
ensure_schema()
seed_defaults()


# 🚀 FastAPI App
app = FastAPI(title="E-commerce API", version="1.0.0")


# 🔧 CORS Setup
def get_allowed_frontend_origins() -> list[str]:
    raw = os.getenv(
        "FRONTEND_ORIGINS",
        "https://ecommercefrontend-9dmu.onrender.com"
    )
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


allowed_frontend_origins = get_allowed_frontend_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_origins=allowed_frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🩺 Health Check
@app.get("/health")
def health_check():
    return {"status": "ok"}


# 🔗 Routes
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(seller_router)
app.include_router(agent_router)