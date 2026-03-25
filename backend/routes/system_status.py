from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.database import get_db, engine
from backend.models.feedback import Feedback
from backend.models.product import Product
from backend.models.user import User
from backend.models.user_behavior import UserBehavior
from backend.services.realtime_pipeline import pipeline
from backend.services.recommendation_engine import get_hybrid_recommendations
from backend.utils.nlp_engine import detect_intent, extract_intent
from backend.utils.storage import get_storage_backend

router = APIRouter(prefix="/admin", tags=["admin"])
SYSTEM_FLAGS = {
    "maintenance_mode": False,
}


def _ensure_admin(db: Session, admin_email: str | None) -> None:
    if not admin_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing admin identity")

    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user or admin_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def _check_storage_connection() -> tuple[bool, str, str]:
    try:
        storage = get_storage_backend()
        backend_name = storage.__class__.__name__
        return True, backend_name, "Storage backend initialized"
    except Exception as exc:
        return False, "Unavailable", str(exc)


@router.get("/system-status")
def get_system_status(
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    _ensure_admin(db, x_admin_email)

    db_connected = True
    db_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_connected = False
        db_error = str(exc)

    product_count = db.query(Product).count()
    behavior_count = db.query(UserBehavior).count()
    feedback_count = db.query(Feedback).count()
    avg_rating = db.query(text("COALESCE(AVG(rating), 0) FROM feedback")).scalar() or 0

    storage_ok, storage_backend, storage_detail = _check_storage_connection()

    sample_user_id = 1
    recommendation_sample: list = []
    recommendation_error = None
    try:
        recommendation_sample = get_hybrid_recommendations(db, user_id=sample_user_id, limit=3)
    except Exception as exc:
        recommendation_error = str(exc)

    nlp_ok = True
    nlp_error = None
    detected_intent = None
    extracted_category = None
    try:
        probe_query = "show me samsung phones above 700"
        detected_intent = detect_intent(probe_query)
        extracted_category = extract_intent(probe_query).get("category")
        nlp_ok = bool(detected_intent)
    except Exception as exc:
        nlp_ok = False
        nlp_error = str(exc)

    recent_events = pipeline.get_recent_events(limit=20)

    return {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "infrastructure": {
            "database": {
                "connected": db_connected,
                "engine": engine.dialect.name,
                "error": db_error,
            },
            "cloud_storage": {
                "connected": storage_ok,
                "backend": storage_backend,
                "detail": storage_detail,
            },
        },
        "platform_controls": {
            "maintenance_mode": SYSTEM_FLAGS["maintenance_mode"],
        },
        "features": {
            "behavior_dataset": {
                "ready": db_connected,
                "event_count": behavior_count,
            },
            "recommendation_engine": {
                "ready": recommendation_error is None,
                "sample_count": len(recommendation_sample),
                "error": recommendation_error,
            },
            "nlp_chatbot": {
                "ready": nlp_ok,
                "intent": detected_intent,
                "category": extracted_category,
                "error": nlp_error,
            },
            "realtime_pipeline": {
                "ready": True,
                "recent_events": len(recent_events),
                "current_version_user_1": pipeline.get_version(sample_user_id),
            },
            "personalization": {
                "ready": recommendation_error is None,
                "sample_user": sample_user_id,
                "sample_count": len(recommendation_sample),
            },
            "catalog_api": {
                "ready": product_count > 0,
                "product_count": product_count,
            },
            "feedback_system": {
                "ready": True,
                "feedback_count": feedback_count,
                "average_rating": round(float(avg_rating), 2),
            },
        },
    }


@router.post("/maintenance-mode/toggle")
def toggle_maintenance_mode(
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    _ensure_admin(db, x_admin_email)
    SYSTEM_FLAGS["maintenance_mode"] = not SYSTEM_FLAGS["maintenance_mode"]
    return {
        "maintenance_mode": SYSTEM_FLAGS["maintenance_mode"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/analytics/clear")
def clear_analytics(
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    _ensure_admin(db, x_admin_email)
    deleted_count = db.query(UserBehavior).delete()
    db.commit()
    return {
        "cleared": True,
        "deleted_events": int(deleted_count),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/reports/generate")
def generate_system_report(
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    _ensure_admin(db, x_admin_email)

    report_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "maintenance_mode": SYSTEM_FLAGS["maintenance_mode"],
        "metrics": {
            "users": db.query(User).count(),
            "products": db.query(Product).count(),
            "orders_events": db.query(UserBehavior).filter(UserBehavior.action == "purchase").count(),
            "behavior_events": db.query(UserBehavior).count(),
            "feedback_count": db.query(Feedback).count(),
        },
    }

    object_name = f"reports/system-report-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    storage = get_storage_backend()
    location = storage.upload_json(object_name, report_payload)

    return {
        "generated": True,
        "location": location,
        "object_name": object_name,
        "report": report_payload,
    }


@router.get("/settings")
def get_system_settings(
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    _ensure_admin(db, x_admin_email)
    return {
        "maintenance_mode": SYSTEM_FLAGS["maintenance_mode"],
        "database_engine": engine.dialect.name,
        "storage_backend": get_storage_backend().__class__.__name__,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
