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
STATUS_OVERRIDES: dict[str, str] = {
    "database": "auto",
    "cloud_storage": "auto",
    "behavior_dataset": "auto",
    "recommendation_engine": "auto",
    "nlp_chatbot": "auto",
    "realtime_pipeline": "auto",
    "personalization": "auto",
    "catalog_api": "auto",
    "feedback_system": "auto",
    "web_assistant_ui": "auto",
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


def _apply_override(target: str, computed: bool) -> tuple[bool, str]:
    mode = STATUS_OVERRIDES.get(target, "auto")
    if mode == "down":
        return False, "override-down"
    if mode == "up":
        return True, "override-up"
    return computed, "live-probe"


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

    product_count = 0
    behavior_count = 0
    feedback_count = 0
    avg_rating = 0
    if db_connected:
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

    db_ready, db_source = _apply_override("database", db_connected)
    storage_ready, storage_source = _apply_override("cloud_storage", storage_ok)
    behavior_ready, behavior_source = _apply_override("behavior_dataset", db_ready)
    recommendation_ready, recommendation_source = _apply_override("recommendation_engine", recommendation_error is None)
    nlp_ready, nlp_source = _apply_override("nlp_chatbot", nlp_ok)
    realtime_ready, realtime_source = _apply_override("realtime_pipeline", True)
    personalization_ready, personalization_source = _apply_override("personalization", recommendation_error is None)
    catalog_ready, catalog_source = _apply_override("catalog_api", product_count > 0)
    feedback_ready, feedback_source = _apply_override("feedback_system", True)
    web_assistant_computed = recommendation_ready and nlp_ready
    web_assistant_ready, web_assistant_source = _apply_override("web_assistant_ui", web_assistant_computed)

    return {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "infrastructure": {
            "database": {
                "connected": db_ready,
                "engine": engine.dialect.name,
                "error": db_error,
                "operational_source": db_source,
            },
            "cloud_storage": {
                "connected": storage_ready,
                "backend": storage_backend,
                "detail": storage_detail,
                "operational_source": storage_source,
            },
        },
        "platform_controls": {
            "maintenance_mode": SYSTEM_FLAGS["maintenance_mode"],
        },
        "status_overrides": STATUS_OVERRIDES,
        "features": {
            "behavior_dataset": {
                "ready": behavior_ready,
                "event_count": behavior_count,
                "operational_source": behavior_source,
            },
            "recommendation_engine": {
                "ready": recommendation_ready,
                "sample_count": len(recommendation_sample),
                "error": recommendation_error,
                "operational_source": recommendation_source,
            },
            "nlp_chatbot": {
                "ready": nlp_ready,
                "intent": detected_intent,
                "category": extracted_category,
                "error": nlp_error,
                "operational_source": nlp_source,
            },
            "realtime_pipeline": {
                "ready": realtime_ready,
                "recent_events": len(recent_events),
                "current_version_user_1": pipeline.get_version(sample_user_id),
                "operational_source": realtime_source,
            },
            "personalization": {
                "ready": personalization_ready,
                "sample_user": sample_user_id,
                "sample_count": len(recommendation_sample),
                "operational_source": personalization_source,
            },
            "catalog_api": {
                "ready": catalog_ready,
                "product_count": product_count,
                "operational_source": catalog_source,
            },
            "feedback_system": {
                "ready": feedback_ready,
                "feedback_count": feedback_count,
                "average_rating": round(float(avg_rating), 2),
                "operational_source": feedback_source,
            },
            "web_assistant_ui": {
                "ready": web_assistant_ready,
                "depends_on": ["recommendation_engine", "nlp_chatbot"],
                "operational_source": web_assistant_source,
            },
        },
    }


@router.post("/status-overrides/{target}")
def set_status_override(
    target: str,
    mode: str,
    db: Session = Depends(get_db),
    x_admin_email: str | None = Header(default=None),
):
    _ensure_admin(db, x_admin_email)

    if target not in STATUS_OVERRIDES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown status target")

    normalized_mode = mode.strip().lower()
    if normalized_mode not in {"auto", "up", "down"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Mode must be auto, up, or down")

    STATUS_OVERRIDES[target] = normalized_mode
    return {
        "target": target,
        "mode": normalized_mode,
        "status_overrides": STATUS_OVERRIDES,
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
