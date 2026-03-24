from collections import Counter, defaultdict
from datetime import datetime, timezone
import re

from sqlalchemy.orm import Session

from backend.models.product import Product
from backend.models.user_behavior import UserBehavior

ACTION_WEIGHTS = {
    "search": 0.4,
    "view": 1.0,
    "click": 1.4,
    "wishlist": 1.6,
    "cart": 2.2,
    "purchase": 3.0,
    "feedback": 1.8,
}

STOPWORDS = {
    "the", "and", "for", "with", "under", "over", "best", "show", "find", "please", "product", "products",
}


def _tokenize(value: str | None) -> list[str]:
    if not value:
        return []
    return [token for token in re.findall(r"[a-z0-9-]+", value.lower()) if len(token) > 2 and token not in STOPWORDS]


def _recency_factor(created_at) -> float:
    if not created_at:
        return 1.0

    now = datetime.now(timezone.utc)
    event_time = created_at
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)

    days_old = max((now - event_time).days, 0)
    if days_old <= 7:
        return 1.25
    if days_old <= 30:
        return 1.1
    if days_old <= 90:
        return 1.0
    return 0.85


def build_user_profile(db: Session, user_id: int) -> dict:
    events = db.query(UserBehavior).filter(UserBehavior.user_id == user_id).all()

    category_scores: dict[str, float] = defaultdict(float)
    keyword_scores: dict[str, float] = defaultdict(float)
    interacted_product_ids: set[int] = set()

    product_ids = [event.product_id for event in events if event.product_id]
    products = {}
    if product_ids:
        product_rows = db.query(Product).filter(Product.id.in_(product_ids)).all()
        products = {product.id: product for product in product_rows}

    for event in events:
        base_weight = ACTION_WEIGHTS.get((event.action or "").lower(), 1.0)
        weight = base_weight * (event.score or 1.0) * _recency_factor(event.created_at)

        if event.product_id and event.product_id in products:
            product = products[event.product_id]
            interacted_product_ids.add(product.id)
            category_scores[product.category] += weight
            for token in _tokenize(product.name):
                keyword_scores[token] += weight

        for token in _tokenize(event.query):
            keyword_scores[token] += weight * 0.65

    top_categories = [name for name, _ in sorted(category_scores.items(), key=lambda item: item[1], reverse=True)[:3]]
    top_keywords = [name for name, _ in sorted(keyword_scores.items(), key=lambda item: item[1], reverse=True)[:8]]

    return {
        "categories": top_categories,
        "keywords": top_keywords,
        "seen_products": interacted_product_ids,
    }


def _content_based_candidates(db: Session, profile: dict, limit: int) -> list[Product]:
    query = db.query(Product).filter(Product.stock > 0)

    categories = profile["categories"]
    if categories:
        query = query.filter(Product.category.in_(categories))

    products = query.order_by(Product.created_at.desc()).limit(max(limit * 4, 20)).all()
    seen = profile["seen_products"]
    keywords = set(profile["keywords"])

    scored: list[tuple[float, Product]] = []
    for product in products:
        if product.id in seen:
            continue

        score = 0.1
        if product.category in categories:
            score += 1.4

        product_tokens = set(_tokenize(product.name) + _tokenize(product.description))
        overlap = len(product_tokens.intersection(keywords))
        score += overlap * 0.3

        scored.append((score, product))

    scored.sort(key=lambda row: row[0], reverse=True)
    return [product for _, product in scored[:limit]]


def _collaborative_candidates(db: Session, user_id: int, seen_product_ids: set[int], limit: int) -> list[Product]:
    rows = db.query(
        UserBehavior.user_id,
        UserBehavior.product_id,
        UserBehavior.action,
        UserBehavior.score,
        UserBehavior.created_at,
    ).filter(
        UserBehavior.product_id.is_not(None)
    ).all()

    by_user: dict[int, set[int]] = defaultdict(set)
    weighted_events: dict[tuple[int, int], float] = defaultdict(float)

    for row in rows:
        product_id = int(row.product_id)
        event_weight = ACTION_WEIGHTS.get((row.action or "").lower(), 1.0) * (row.score or 1.0) * _recency_factor(row.created_at)
        by_user[row.user_id].add(product_id)
        weighted_events[(row.user_id, product_id)] += event_weight

    target = by_user.get(user_id, set())
    if not target:
        return []

    similar_users: list[tuple[float, int]] = []
    for other_user, other_products in by_user.items():
        if other_user == user_id:
            continue
        overlap = len(target.intersection(other_products))
        if overlap == 0:
            continue
        union = len(target.union(other_products))
        similarity = overlap / max(union, 1)
        similar_users.append((similarity, other_user))

    similar_users.sort(key=lambda item: item[0], reverse=True)
    similar_users = similar_users[:10]

    product_scores: Counter[int] = Counter()
    for similarity, other_user in similar_users:
        for product_id in by_user[other_user]:
            if product_id in target or product_id in seen_product_ids:
                continue
            product_scores[product_id] += similarity * weighted_events[(other_user, product_id)]

    if not product_scores:
        return []

    ranked_ids = [product_id for product_id, _ in product_scores.most_common(limit * 2)]
    ranked_products = db.query(Product).filter(Product.id.in_(ranked_ids), Product.stock > 0).all()
    lookup = {product.id: product for product in ranked_products}

    return [lookup[product_id] for product_id in ranked_ids if product_id in lookup][:limit]


def get_hybrid_recommendations(db: Session, user_id: int, limit: int = 8) -> list[Product]:
    profile = build_user_profile(db, user_id)
    seen = profile["seen_products"]

    collaborative = _collaborative_candidates(db, user_id, seen, limit=limit)
    content_based = _content_based_candidates(db, profile, limit=limit)

    merged: list[Product] = []
    seen_ids: set[int] = set()

    for candidate in collaborative + content_based:
        if candidate.id in seen_ids:
            continue
        merged.append(candidate)
        seen_ids.add(candidate.id)
        if len(merged) >= limit:
            return merged

    if len(merged) < limit:
        fallback = db.query(Product).filter(Product.stock > 0).order_by(Product.created_at.desc()).limit(limit * 2).all()
        for candidate in fallback:
            if candidate.id in seen_ids or candidate.id in seen:
                continue
            merged.append(candidate)
            seen_ids.add(candidate.id)
            if len(merged) >= limit:
                break

    return merged[:limit]
