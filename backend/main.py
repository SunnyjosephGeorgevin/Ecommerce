import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

# Allow imports like backend.database even when running from backend/ as cwd.
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from backend.database import Base, SessionLocal, engine
from backend.models.feedback import Feedback
from backend.models.user import User
from backend.models.product import Product
from backend.routes.auth import hash_password
from backend.routes.auth import router as auth_router
from backend.routes.behavior import router as behavior_router
from backend.routes.feedback import router as feedback_router
from backend.routes.orders import router as orders_router
from backend.routes.products import router as products_router
from backend.routes.recommendations import router as recommendations_router
from backend.routes.seller import router as seller_router
from backend.routes.system_status import router as system_status_router
from backend.routes.users import router as users_router

from backend.routes.agent import router as agent_router
from backend.seed_products import products as full_seed_products

from backend.models.user_behavior import UserBehavior

# ✅ Create tables
Base.metadata.create_all(bind=engine)


# 🔧 Ensure schema updates safely
def ensure_schema() -> None:
    db: Session = SessionLocal()
    try:
        inspector = inspect(engine)
        columns = [column["name"] for column in inspector.get_columns("users")]

        if "is_approved" not in columns:
            default_true = "1" if engine.dialect.name == "sqlite" else "TRUE"
            db.execute(
                text(
                    f"ALTER TABLE users ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT {default_true}"
                )
            )
            db.commit()

        if "user_behavior" in inspector.get_table_names():
            behavior_columns = [
                column["name"] for column in inspector.get_columns("user_behavior")
            ]

            if "score" not in behavior_columns:
                db.execute(text("ALTER TABLE user_behavior ADD COLUMN score FLOAT NOT NULL DEFAULT 1"))
                db.commit()

            if "session_id" not in behavior_columns:
                db.execute(text("ALTER TABLE user_behavior ADD COLUMN session_id VARCHAR(120)"))
                db.commit()

            if "context_json" not in behavior_columns:
                db.execute(text("ALTER TABLE user_behavior ADD COLUMN context_json TEXT"))
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


def seed_demo_products_if_empty() -> None:
    db: Session = SessionLocal()
    try:
        existing_names = {name for (name,) in db.query(Product.name).all()}
        missing_payloads = [payload for payload in full_seed_products if payload["name"] not in existing_names]

        if not missing_payloads:
            return

        db.add_all([Product(**payload) for payload in missing_payloads])
        db.commit()
    finally:
        db.close()


# Run setup
ensure_schema()
seed_defaults()
seed_demo_products_if_empty()


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
    allow_origin_regex=r"https?://((localhost|127\.0\.0\.1)(:\d+)?|[a-zA-Z0-9-]+\.onrender\.com)",
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
app.include_router(behavior_router)
app.include_router(feedback_router)
app.include_router(recommendations_router)
app.include_router(system_status_router)