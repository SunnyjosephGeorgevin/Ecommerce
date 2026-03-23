from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.database import get_db
from backend.models.product import Product
from backend.models.user_behavior import UserBehavior
from backend.agent_memory import get_user_memory, update_user_memory
from backend.utils.nlp_engine import (
    KEYWORD_VARIANTS,
    detect_intent,
    extract_intent,
    generate_response,
    generate_suggestions,
)

router = APIRouter(prefix="/agent", tags=["Agent"])


def apply_category_filter(query, category: str | None):
    if not category:
        return query

    if category == "electronics":
        return query.filter(Product.category.in_(["laptop", "mobile"]))

    return query.filter(Product.category == category)


def get_user_preferences(db: Session, user_id: int):
    history = db.query(UserBehavior).filter(
        UserBehavior.user_id == user_id
    ).all()

    keyword_count = {}

    for h in history:
        if h.query:
            words = h.query.lower().split()
            for w in words:
                keyword_count[w] = keyword_count.get(w, 0) + 1

    # top 3 frequent words
    sorted_keywords = sorted(keyword_count, key=keyword_count.get, reverse=True)

    return sorted_keywords[:3]


def build_keyword_conditions(keywords: list[str]):
    conditions = []

    for kw in keywords:
        variants = KEYWORD_VARIANTS.get(kw, [kw])
        for v in variants:
            conditions.append(Product.name.ilike(f"%{v}%"))

    return conditions


# 🤖 AGENT ENDPOINT
@router.post("/query")
def agent_query(payload: dict, db: Session = Depends(get_db)):
    user_query = payload.get("query", "")

    user_id = payload.get("user_id", "guest")
    memory = get_user_memory(user_id)

    db_user_id = payload.get("user_id", 1)
    try:
        db_user_id = int(db_user_id)
    except (TypeError, ValueError):
        db_user_id = 1

    preferences = get_user_preferences(db, db_user_id)

    # 🔹 STORE SEARCH
    db.add(UserBehavior(
        user_id=db_user_id,
        action="search",
        query=user_query
    ))
    db.commit()

    intent = detect_intent(user_query)
    filters = extract_intent(user_query)

    # Merge previous filters if missing
    if not filters["category"] and memory.get("category"):
        filters["category"] = memory["category"]

    if not filters["max_price"] and memory.get("max_price"):
        filters["max_price"] = memory["max_price"]

    if not filters["min_price"] and memory.get("min_price"):
        filters["min_price"] = memory["min_price"]

    query = db.query(Product)

    # CATEGORY FILTER
    query = apply_category_filter(query, filters["category"])

    # KEYWORD FILTER
    if filters["keywords"]:
        conditions = build_keyword_conditions(filters["keywords"])

        if conditions:
            query = query.filter(or_(*conditions))

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

    if preferences:
        pref_query = db.query(Product)

        # Apply same active intent filters first so personalization can't drift.
        pref_query = apply_category_filter(pref_query, filters["category"])

        if filters["keywords"]:
            active_conditions = build_keyword_conditions(filters["keywords"])
            if active_conditions:
                pref_query = pref_query.filter(or_(*active_conditions))

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
    results = results[:5]

    # 🧠 FINAL RECOMMENDATION ENGINE (3-LAYER FALLBACK)
    recommendations = []

    if results:
        base_product = results[0]

        base_query = db.query(Product).filter(
            Product.category == base_product.category,
            Product.id != base_product.id
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

        recommendations = level1.limit(5).all()

        # 🔹 LEVEL 2: KEYWORD ONLY
        if not recommendations and filters["keywords"]:
            conditions = build_keyword_conditions(filters["keywords"])
            if conditions:
                level2 = base_query.filter(or_(*conditions))
                recommendations = level2.limit(5).all()

        # 🔹 LEVEL 3: CATEGORY ONLY (FINAL FALLBACK)
        if not recommendations:
            recommendations = base_query.limit(5).all()

        # Slightly higher priced alternatives
        if len(recommendations) < 5:
            higher_price = db.query(Product).filter(
                Product.category == base_product.category,
                Product.id != base_product.id,
                Product.price > base_product.price,
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

    return {
        "query": user_query,
        "intent": intent,
        "filters": filters,
        "message": message,
        "results": format_products(results),
        "recommendations": format_products(recommendations),
        "suggestions": suggestions,
    }