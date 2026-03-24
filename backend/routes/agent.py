import json
from difflib import SequenceMatcher

from fastapi import APIRouter, Depends
from sqlalchemy import inspect, or_, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.database import engine, get_db
from backend.models.product import Product
from backend.models.user_behavior import UserBehavior
from backend.agent_memory import get_user_memory, update_user_memory
from backend.services.realtime_pipeline import pipeline
from backend.services.recommendation_engine import get_hybrid_recommendations
from backend.utils.nlp_engine import (
    KEYWORD_VARIANTS,
    detect_intent,
    extract_intent,
    generate_response,
    generate_suggestions,
)

router = APIRouter(prefix="/agent", tags=["Agent"])

STOP_WORDS = {
    "i", "want", "need", "show", "find", "me", "a", "an", "the", "please", "for", "with",
    "under", "over", "below", "above", "best", "cheap", "premium", "options", "option",
}

FOLLOWUP_HINTS = {"also", "similar", "more", "another", "same", "like", "else", "again", "show"}


def ensure_behavior_schema_compat(db: Session) -> None:
    inspector = inspect(engine)
    if "user_behavior" not in inspector.get_table_names():
        return

    behavior_columns = {
        column["name"] for column in inspector.get_columns("user_behavior")
    }

    if "score" not in behavior_columns:
        db.execute(text("ALTER TABLE user_behavior ADD COLUMN score FLOAT NOT NULL DEFAULT 1"))
        db.commit()

    if "session_id" not in behavior_columns:
        db.execute(text("ALTER TABLE user_behavior ADD COLUMN session_id VARCHAR(120)"))
        db.commit()

    if "context_json" not in behavior_columns:
        db.execute(text("ALTER TABLE user_behavior ADD COLUMN context_json TEXT"))
        db.commit()


def apply_category_filter(query, category: str | None):
    if not category:
        return query

    if category == "electronics":
        return query.filter(Product.category.in_(["laptop", "mobile"]))

    return query.filter(Product.category == category)


def get_user_preferences(db: Session, user_id: int):
    history = db.query(UserBehavior.query, UserBehavior.action, UserBehavior.score).filter(
        UserBehavior.user_id == user_id,
        UserBehavior.action.in_(["search", "click", "wishlist", "cart", "purchase", "feedback"]),
    ).all()

    keyword_score: dict[str, float] = {}
    action_weight = {
        "search": 0.6,
        "click": 1.0,
        "wishlist": 1.3,
        "cart": 1.6,
        "purchase": 2.1,
        "feedback": 1.4,
    }

    for query_text, action, score in history:
        if query_text:
            words = query_text.lower().split()
            weight = action_weight.get((action or "").lower(), 1.0) * (score or 1.0)
            for w in words:
                keyword_score[w] = keyword_score.get(w, 0) + weight

    # top 3 frequent words
    sorted_keywords = sorted(keyword_score, key=keyword_score.get, reverse=True)

    return sorted_keywords[:6]


def build_keyword_conditions(keywords: list[str]):
    conditions = []

    for kw in keywords:
        variants = KEYWORD_VARIANTS.get(kw, [kw])
        for v in variants:
            conditions.append(Product.name.ilike(f"%{v}%"))
            conditions.append(Product.description.ilike(f"%{v}%"))
            conditions.append(Product.category.ilike(f"%{v}%"))

    return conditions


def build_brand_conditions(brands: list[str]):
    return [Product.name.ilike(f"%{brand}%") for brand in brands]


def _query_keywords(user_query: str) -> set[str]:
    raw_tokens = [token.strip(" ,.!?\"'()[]{}") for token in user_query.lower().split()]
    return {token for token in raw_tokens if token and token not in STOP_WORDS and len(token) > 2}


def find_similar_products(
    db: Session,
    user_query: str,
    category_hint: str | None,
    limit: int = 5,
    exclude_ids: set[int] | None = None,
) -> list[Product]:
    exclude_ids = exclude_ids or set()
    query = db.query(Product).filter(Product.stock > 0)
    query = apply_category_filter(query, category_hint)
    candidates = query.all()

    if not candidates and category_hint:
        candidates = db.query(Product).filter(Product.stock > 0).all()

    query_keywords = _query_keywords(user_query)
    query_variants: set[str] = set(query_keywords)
    for keyword in query_keywords:
        for variant in KEYWORD_VARIANTS.get(keyword, [keyword]):
            query_variants.add(variant.lower())
    lowered_query = user_query.lower().strip()

    scored: list[tuple[float, Product]] = []
    for candidate in candidates:
        if candidate.id in exclude_ids:
            continue

        name_l = candidate.name.lower()
        description_l = (candidate.description or "").lower()
        product_tokens = set(name_l.split()) | set(description_l.split())
        token_overlap = len(query_variants.intersection(product_tokens))
        ratio = SequenceMatcher(None, lowered_query, f"{name_l} {description_l}"[:300]).ratio()

        score = ratio + (token_overlap * 0.28)
        if candidate.category == category_hint:
            score += 0.2
        if token_overlap > 0 or ratio >= 0.55:
            scored.append((score, candidate))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [product for _, product in scored[:limit]]


def build_unavailable_message(user_query: str) -> str:
    return f"No exact in-stock match for '{user_query}'. Similar recommendations include:"


def build_unavailable_suggestions(filters: dict, user_query: str) -> list[str]:
    suggestions: list[str] = []

    if filters.get("brands"):
        suggestions.append("Switch brand")

    if filters.get("max_price"):
        suggestions.append(f"Increase budget above {filters['max_price']}")
    else:
        suggestions.append("Set a budget range")

    if filters.get("category"):
        suggestions.append(f"Show similar in {filters['category']}")
    else:
        inferred = infer_fallback_category(user_query)
        if inferred:
            suggestions.append(f"Show similar in {inferred}")

    suggestions.append("Explore newest alternatives")
    # Keep chips concise and unique.
    return list(dict.fromkeys(suggestions))[:4]


def infer_fallback_category(user_query: str) -> str | None:
    q = user_query.lower()

    if any(term in q for term in ["playstation", "xbox", "console", "gaming", "pc"]):
        return "laptop"
    if any(term in q for term in ["phone", "iphone", "galaxy", "pixel", "mobile"]):
        return "mobile"
    if any(term in q for term in ["nike", "adidas", "shoe", "sneaker"]):
        return "sneakers"
    if any(term in q for term in ["watch", "band", "strap", "earbuds", "headphones"]):
        return "accessories"

    return None


def fallback_similar_products(db: Session, user_query: str, limit: int = 5) -> list[Product]:
    inferred_category = infer_fallback_category(user_query)
    fallback_query = db.query(Product).filter(Product.stock > 0)

    if inferred_category:
        fallback_query = fallback_query.filter(Product.category == inferred_category)
    else:
        fallback_query = fallback_query.filter(Product.category.in_(["mobile", "laptop", "accessories", "sneakers"]))

    return fallback_query.order_by(Product.created_at.desc()).limit(limit).all()


def should_use_memory_context(user_query: str, filters: dict) -> bool:
    tokens = _query_keywords(user_query)
    has_direct_signal = bool(filters.get("category") or filters.get("keywords") or filters.get("brands") or filters.get("min_price") or filters.get("max_price"))

    # Use memory only on short follow-ups without strong fresh intent.
    if not has_direct_signal and len(tokens) <= 4:
        return True

    return any(token in FOLLOWUP_HINTS for token in tokens) and len(tokens) <= 5


def semantic_rerank(products: list[Product], query_text: str, category_hint: str | None = None) -> list[Product]:
    if not products:
        return []

    query_lower = query_text.lower().strip()
    keywords = _query_keywords(query_text)

    def score(product: Product) -> float:
        name_l = product.name.lower()
        desc_l = (product.description or "").lower()
        text_blob = f"{name_l} {desc_l}"

        overlap = len([kw for kw in keywords if kw in text_blob])
        sim = SequenceMatcher(None, query_lower, text_blob[:300]).ratio()
        category_boost = 0.2 if category_hint and product.category == category_hint else 0.0
        return (overlap * 0.3) + sim + category_boost

    return sorted(products, key=score, reverse=True)


def log_agent_quality_event(
    db: Session,
    user_id: int,
    query_text: str,
    intent: str,
    filters: dict,
    result_count: int,
    recommendation_count: int,
    unavailable_mode: bool,
) -> None:
    payload = {
        "intent": intent,
        "category": filters.get("category"),
        "brands": filters.get("brands", []),
        "price": {
            "min": filters.get("min_price"),
            "max": filters.get("max_price"),
        },
        "result_count": result_count,
        "recommendation_count": recommendation_count,
        "unavailable_mode": unavailable_mode,
    }

    score = min(1.0, (result_count * 0.12) + (recommendation_count * 0.08))
    try:
        db.add(UserBehavior(
            user_id=user_id,
            action="agent_response",
            query=query_text,
            score=score,
            context_json=json.dumps(payload),
        ))
        db.commit()
    except SQLAlchemyError:
        db.rollback()


def apply_active_filters_to_products(products: list[Product], filters: dict) -> list[Product]:
    category = filters.get("category")
    min_price = filters.get("min_price")
    max_price = filters.get("max_price")

    filtered = [product for product in products if product.stock > 0]

    if category:
        if category == "electronics":
            filtered = [p for p in filtered if p.category in {"mobile", "laptop"}]
        else:
            filtered = [p for p in filtered if p.category == category]

    if min_price is not None:
        filtered = [p for p in filtered if p.price >= min_price]

    if max_price is not None:
        filtered = [p for p in filtered if p.price <= max_price]

    return filtered


def build_relaxed_recommendations(db: Session, user_query: str, filters: dict, limit: int = 5) -> list[Product]:
    relaxed_query = db.query(Product).filter(Product.stock > 0)
    relaxed_query = apply_category_filter(relaxed_query, filters.get("category"))

    keywords = filters.get("keywords") or []
    if keywords:
        conditions = build_keyword_conditions(keywords)
        if conditions:
            relaxed_query = relaxed_query.filter(or_(*conditions))

    brands = filters.get("brands") or []
    if brands:
        brand_conditions = build_brand_conditions(brands)
        if brand_conditions:
            relaxed_query = relaxed_query.filter(or_(*brand_conditions))

    relaxed = relaxed_query.order_by(Product.created_at.desc()).limit(max(limit * 2, 8)).all()

    if not relaxed:
        relaxed = fallback_similar_products(db, user_query=user_query, limit=max(limit * 2, 8))

    return semantic_rerank(relaxed, user_query, filters.get("category"))[:limit]


# 🤖 AGENT ENDPOINT
@router.post("/query")
def agent_query(payload: dict, db: Session = Depends(get_db)):
    user_query = payload.get("query", "")

    ensure_behavior_schema_compat(db)

    user_id = payload.get("user_id", "guest")
    memory = get_user_memory(user_id)

    db_user_id = payload.get("user_id", 1)
    try:
        db_user_id = int(db_user_id)
    except (TypeError, ValueError):
        db_user_id = 1

    preferences = get_user_preferences(db, db_user_id)

    # 🔹 STORE SEARCH
    try:
        db.add(UserBehavior(
            user_id=db_user_id,
            action="search",
            query=user_query,
            score=1.0,
        ))
        db.commit()
    except SQLAlchemyError:
        db.rollback()

    pipeline.publish(db_user_id, "search", {"query": user_query})

    intent = detect_intent(user_query)
    filters = extract_intent(user_query)
    free_text_keywords = _query_keywords(user_query)
    is_specific_named_query = (
        intent == "search"
        and not filters.get("category")
        and not filters.get("keywords")
        and len(free_text_keywords) >= 1
    )

    # Merge previous filters only for contextual follow-up prompts.
    if not is_specific_named_query and should_use_memory_context(user_query, filters):
        if not filters["category"] and memory.get("category"):
            filters["category"] = memory["category"]

        if not filters["max_price"] and not filters.get("min_price") and memory.get("max_price"):
            filters["max_price"] = memory["max_price"]

        if not filters["min_price"] and not filters.get("max_price") and memory.get("min_price"):
            filters["min_price"] = memory["min_price"]

    query = db.query(Product).filter(Product.stock > 0)

    if is_specific_named_query:
        strict_name_conditions = [Product.name.ilike(f"%{token}%") for token in free_text_keywords]
        for condition in strict_name_conditions:
            query = query.filter(condition)

    # CATEGORY FILTER
    query = apply_category_filter(query, filters["category"])

    # KEYWORD FILTER
    if filters["keywords"]:
        conditions = build_keyword_conditions(filters["keywords"])

        if conditions:
            query = query.filter(or_(*conditions))

    if filters.get("brands"):
        brand_conditions = build_brand_conditions(filters["brands"])
        if brand_conditions:
            query = query.filter(or_(*brand_conditions))

    # PRICE FILTER
    if filters["max_price"]:
        query = query.filter(Product.price <= filters["max_price"])
    if filters["min_price"]:
        query = query.filter(Product.price >= filters["min_price"])

    # SORTING
    if filters["sort"] == "asc":
        query = query.order_by(Product.price.asc())
    elif filters["sort"] == "desc":
        query = query.order_by(Product.price.desc())

    # 🧠 PERSONALIZATION FIX (CORRECT WAY)
    personalized_results = []

    if preferences and not is_specific_named_query:
        pref_query = db.query(Product).filter(Product.stock > 0)

        # Apply same active intent filters first so personalization can't drift.
        pref_query = apply_category_filter(pref_query, filters["category"])

        if filters["keywords"]:
            active_conditions = build_keyword_conditions(filters["keywords"])
            if active_conditions:
                pref_query = pref_query.filter(or_(*active_conditions))

        if filters.get("brands"):
            pref_brand_conditions = build_brand_conditions(filters["brands"])
            if pref_brand_conditions:
                pref_query = pref_query.filter(or_(*pref_brand_conditions))

        if filters["max_price"]:
            pref_query = pref_query.filter(Product.price <= filters["max_price"])

        if filters["min_price"]:
            pref_query = pref_query.filter(Product.price >= filters["min_price"])

        # 🔥 Apply preference keywords
        pref_conditions = build_keyword_conditions(preferences)

        if pref_conditions:
            pref_query = pref_query.filter(or_(*pref_conditions))

        personalized_results = pref_query.limit(3).all()

    normal_results = query.limit(5).all()

    # 🔥 MERGE (PERSONALIZED FIRST)
    results = personalized_results + [
        p for p in normal_results if p.id not in [x.id for x in personalized_results]
    ]

    # LIMIT FINAL TO 5
    results = semantic_rerank(results, user_query, filters.get("category"))[:5]

    # 🧠 FINAL RECOMMENDATION ENGINE (3-LAYER FALLBACK)
    recommendations = []

    if results:
        base_product = results[0]

        base_query = db.query(Product).filter(
            Product.category == base_product.category,
            Product.id != base_product.id,
            Product.stock > 0,
        )

        # 🔹 LEVEL 1: KEYWORD + PRICE
        level1 = base_query

        if filters["keywords"]:
            conditions = build_keyword_conditions(filters["keywords"])

            if conditions:
                level1 = level1.filter(or_(*conditions))

        level1 = level1.filter(
            Product.price.between(base_product.price - 50, base_product.price + 50)
        )

        recommendations = level1.limit(12).all()

        # 🔹 LEVEL 2: KEYWORD ONLY
        if not recommendations and filters["keywords"]:
            conditions = build_keyword_conditions(filters["keywords"])
            if conditions:
                level2 = base_query.filter(or_(*conditions))
                recommendations = level2.limit(12).all()

        # 🔹 LEVEL 3: CATEGORY ONLY (FINAL FALLBACK)
        if not recommendations:
            recommendations = base_query.limit(12).all()

        # Slightly higher priced alternatives
        if len(recommendations) < 5:
            higher_price = db.query(Product).filter(
                Product.category == base_product.category,
                Product.id != base_product.id,
                Product.price > base_product.price,
                Product.stock > 0,
            ).order_by(Product.price.asc()).limit(5).all()

            existing_ids = {r.id for r in recommendations}
            for candidate in higher_price:
                if candidate.id not in existing_ids:
                    recommendations.append(candidate)
                    existing_ids.add(candidate.id)
                if len(recommendations) >= 5:
                    break

        # Trending fallback by recency
        if len(recommendations) < 5:
            trending = db.query(Product).filter(
                Product.category == base_product.category,
                Product.id != base_product.id,
                Product.stock > 0,
            ).order_by(Product.created_at.desc()).limit(5).all()

            existing_ids = {r.id for r in recommendations}
            for candidate in trending:
                if candidate.id not in existing_ids:
                    recommendations.append(candidate)
                    existing_ids.add(candidate.id)
                if len(recommendations) >= 5:
                    break

        # 🔥 REMOVE DUPLICATES
        recommendations = [
            r for r in recommendations if r.id not in [p.id for p in results]
        ]
        recommendations = semantic_rerank(recommendations, user_query, filters.get("category"))[:5]

    # Save memory after query
    update_user_memory(user_id, {
        "category": filters.get("category"),
        "max_price": filters.get("max_price"),
        "min_price": filters.get("min_price"),
        "sort": filters.get("sort"),
        "keywords": filters.get("keywords", []),
    })

    message = generate_response(intent, results, filters)
    suggestions = generate_suggestions(filters)

    # FORMAT
    def format_products(products):
        return [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "category": p.category,
                "image_url": p.image_url,
            }
            for p in products
        ]

    hybrid_recommendations = [
        rec for rec in get_hybrid_recommendations(db, user_id=db_user_id, limit=5) if rec.stock > 0
    ]
    if filters.get("category"):
        hybrid_recommendations = [rec for rec in hybrid_recommendations if rec.category == filters["category"]]

    unavailable_mode = False

    if not results:
        similar_recommendations = find_similar_products(
            db,
            user_query=user_query,
            category_hint=filters.get("category"),
            limit=5,
            exclude_ids=set(),
        )

        unavailable_mode = True
        message = build_unavailable_message(user_query)
        suggestions = build_unavailable_suggestions(filters, user_query)
        recommendations = similar_recommendations or fallback_similar_products(db, user_query=user_query, limit=8)
        recommendations = semantic_rerank(recommendations, user_query, filters.get("category"))[:5]

    # Final guardrail: always enforce active intent filters on recommendation cards.
    recommendations = apply_active_filters_to_products(recommendations, filters)

    merged_recommendations = recommendations
    if not unavailable_mode:
        filtered_hybrid = apply_active_filters_to_products(hybrid_recommendations, filters)
        merged_recommendations = recommendations + [
            rec
            for rec in filtered_hybrid
            if rec.id not in [existing.id for existing in recommendations]
        ]

    merged_recommendations = apply_active_filters_to_products(merged_recommendations, filters)
    merged_recommendations = merged_recommendations[:5]

    if not merged_recommendations:
        merged_recommendations = build_relaxed_recommendations(
            db,
            user_query=user_query,
            filters=filters,
            limit=5,
        )

    log_agent_quality_event(
        db=db,
        user_id=db_user_id,
        query_text=user_query,
        intent=intent,
        filters=filters,
        result_count=len(results),
        recommendation_count=len(merged_recommendations),
        unavailable_mode=unavailable_mode,
    )

    return {
        "query": user_query,
        "intent": intent,
        "filters": filters,
        "message": message,
        "results": format_products(results),
        "recommendations": format_products(merged_recommendations),
        "suggestions": suggestions,
    }