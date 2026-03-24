from __future__ import annotations

import os
from dataclasses import dataclass

from backend.database import SessionLocal
from backend.main import ensure_schema
from backend.routes.agent import agent_query
from backend.routes.behavior import export_behavior_dataset, get_recent_events, track_behavior
from backend.routes.feedback import create_feedback, feedback_summary
from backend.routes.orders import create_order
from backend.routes.products import get_products
from backend.routes.recommendations import get_hybrid, get_realtime
from backend.schemas.behavior import BehaviorEventCreate
from backend.schemas.feedback import FeedbackCreate
from backend.schemas.order import OrderCreate
from backend.services.recommendation_engine import get_hybrid_recommendations


@dataclass
class CheckResult:
    requirement: str
    passed: bool
    details: str


def _run_in_db(fn, *args, **kwargs):
    db = SessionLocal()
    try:
        return fn(*args, db=db, **kwargs)
    finally:
        db.close()


def check_r1_user_behavior_dataset(user_id: int) -> CheckResult:
    event = _run_in_db(
        track_behavior,
        payload=BehaviorEventCreate(
            user_id=user_id,
            action="click",
            query="nike sneakers",
            product_id=1,
            score=1.2,
            session_id="feature-check",
            context_json='{"source":"system-check"}',
        ),
    )

    events = get_recent_events(user_id=user_id, limit=20)
    has_event = any(item.get("event_type") == "click" for item in events.get("events", []))

    export = _run_in_db(export_behavior_dataset)
    exported = int(export.get("records", 0)) > 0 and bool(export.get("location"))

    passed = bool(event.id) and has_event and exported
    details = f"tracked_event_id={event.id}, recent_events={len(events.get('events', []))}, export_records={export.get('records', 0)}"
    return CheckResult("R1 User behavior dataset", passed, details)


def check_r2_recommendation_engine(user_id: int) -> CheckResult:
    data = _run_in_db(get_hybrid, user_id=user_id, limit=8)
    recs = data.get("recommendations", [])
    passed = data.get("strategy") == "hybrid-collaborative-content" and len(recs) > 0
    details = f"strategy={data.get('strategy')}, rec_count={len(recs)}"
    return CheckResult("R2 Recommendation engine", passed, details)


def check_r3_nlp_chatbot(user_id: int) -> CheckResult:
    response = _run_in_db(agent_query, payload={"query": "show me samsung phones above 700", "user_id": user_id})
    intent = response.get("intent")
    filters = response.get("filters", {})
    passed = intent in {"refine", "search"} and filters.get("category") == "mobile" and len(response.get("results", [])) > 0
    details = f"intent={intent}, category={filters.get('category')}, result_count={len(response.get('results', []))}"
    return CheckResult("R3 NLP chatbot", passed, details)


def check_r4_realtime_recommendation(user_id: int) -> CheckResult:
    _run_in_db(
        track_behavior,
        payload=BehaviorEventCreate(
            user_id=user_id,
            action="view",
            query="iphone",
            product_id=2,
            score=1.0,
            session_id="feature-check-rt",
            context_json='{"source":"realtime-check"}',
        ),
    )
    realtime = _run_in_db(get_realtime, user_id=user_id, limit=6)
    passed = int(realtime.get("version", 0)) >= 1 and len(realtime.get("recommendations", [])) > 0
    details = f"version={realtime.get('version')}, rec_count={len(realtime.get('recommendations', []))}"
    return CheckResult("R4 Real-time recommendation", passed, details)


def check_r5_personalization_engine(user_id: int) -> CheckResult:
    _run_in_db(
        track_behavior,
        payload=BehaviorEventCreate(
            user_id=user_id,
            action="purchase",
            query="nike running shoe",
            product_id=1,
            score=2.0,
            session_id="feature-check-pers",
            context_json='{"source":"personalization-check"}',
        ),
    )
    db = SessionLocal()
    try:
        personalized = get_hybrid_recommendations(db, user_id=user_id, limit=6)
    finally:
        db.close()

    passed = len(personalized) > 0
    details = f"personalized_recommendations={len(personalized)}"
    return CheckResult("R5 Personalization engine", passed, details)


def check_r6_api_integration_catalog() -> CheckResult:
    products = _run_in_db(get_products, category="footwear")
    passed = len(products) > 0 and all(getattr(p, "category", "") in {"footwear", "sneakers"} for p in products)
    details = f"catalog_count={len(products)}"
    return CheckResult("R6 API integration with catalog", passed, details)


def check_r7_feedback_system(user_id: int) -> CheckResult:
    feedback = _run_in_db(
        create_feedback,
        payload=FeedbackCreate(
            user_id=user_id,
            product_id=1,
            rating=4,
            comment="Great quality and fit",
            source="system-check",
        ),
    )
    summary = _run_in_db(feedback_summary, product_id=1)
    passed = bool(feedback.id) and int(summary.get("count", 0)) >= 1 and float(summary.get("avg_rating", 0)) >= 1.0
    details = f"feedback_id={feedback.id}, count={summary.get('count')}, avg_rating={summary.get('avg_rating')}"
    return CheckResult("R7 Feedback system", passed, details)


def smoke_order_flow(user_id: int) -> CheckResult:
    order = _run_in_db(
        create_order,
        payload=OrderCreate(user_id=user_id, total=249.75, items_count=2, status="confirmed"),
    )
    passed = bool(order.id) and float(order.total) == 249.75
    details = f"order_id={order.id}, total={order.total}, status={order.status}"
    return CheckResult("Order flow sanity", passed, details)


def run_all_checks() -> list[CheckResult]:
    ensure_schema()
    # Keep dataset export writable in local/dev environments.
    os.environ.setdefault("LOCAL_STORAGE_PATH", "./backend/storage_data")

    user_id = 9901

    checks = [
        check_r1_user_behavior_dataset(user_id),
        check_r2_recommendation_engine(user_id),
        check_r3_nlp_chatbot(user_id),
        check_r4_realtime_recommendation(user_id),
        check_r5_personalization_engine(user_id),
        check_r6_api_integration_catalog(),
        check_r7_feedback_system(user_id),
        smoke_order_flow(user_id),
    ]
    return checks


def main() -> int:
    checks = run_all_checks()

    print("System feature check report")
    print("=" * 60)

    failed = 0
    for item in checks:
        status = "PASS" if item.passed else "FAIL"
        print(f"[{status}] {item.requirement}: {item.details}")
        if not item.passed:
            failed += 1

    print("=" * 60)
    if failed:
        print(f"Feature checks failed: {failed}")
        return 1

    print("All requested feature checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
