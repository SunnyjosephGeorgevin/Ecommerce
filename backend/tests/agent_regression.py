from __future__ import annotations

import sys
from dataclasses import dataclass

from backend.database import SessionLocal
from backend.main import ensure_schema
from backend.models.product import Product
from backend.routes.agent import agent_query


@dataclass
class Scenario:
    name: str
    query: str
    user_id: int


def _run_query(query: str, user_id: int) -> dict:
    db = SessionLocal()
    try:
        return agent_query({"query": query, "user_id": user_id}, db)
    finally:
        db.close()


def _has_token(products: list[dict], token: str) -> bool:
    token_l = token.lower()
    return any(token_l in p.get("name", "").lower() for p in products)


def _all_under(products: list[dict], max_price: float) -> bool:
    return all(float(p.get("price", 0)) <= max_price for p in products)


def validate_scenarios() -> tuple[bool, list[str]]:
    errors: list[str] = []

    ensure_schema()

    db = SessionLocal()
    try:
        total_products = db.query(Product).count()
    finally:
        db.close()

    if total_products == 0:
        return False, ["Product catalog is empty. Seed products before running regression checks."]

    scenarios = [
        Scenario("budget_laptop", "I want a good laptop under 1500", 9101),
        Scenario("brand_mobile", "Show me samsung phones above 700", 9102),
        Scenario("sneaker_budget", "Need nike sneakers under 220", 9103),
        Scenario("unavailable_product", "playstation 5", 9104),
        Scenario("compare_mobile", "compare iphone and samsung premium options", 9105),
        Scenario("empty_query", "", 9106),
        Scenario("typo_brand", "samssung mobile under 900", 9107),
        Scenario("very_low_budget", "laptop under 50", 9108),
        Scenario("very_high_budget", "mobile above 20000", 9109),
        Scenario("compare_no_exact", "compare blackberry and nokia flagship", 9110),
    ]

    results_map = {scenario.name: _run_query(scenario.query, scenario.user_id) for scenario in scenarios}

    # 1) Budget laptop query should return laptop-focused in-budget results.
    budget = results_map["budget_laptop"]
    budget_results = budget.get("results", [])
    if not budget_results:
        errors.append("budget_laptop: expected non-empty results.")
    if budget.get("filters", {}).get("category") != "laptop":
        errors.append("budget_laptop: expected category=laptop.")
    if budget_results and not _all_under(budget_results, 1500):
        errors.append("budget_laptop: expected all result prices <= 1500.")

    # 2) Samsung mobile query should recognize mobile category and include Samsung options.
    mobile = results_map["brand_mobile"]
    mobile_results = mobile.get("results", [])
    if mobile.get("filters", {}).get("category") != "mobile":
        errors.append("brand_mobile: expected category=mobile.")
    if not mobile_results:
        errors.append("brand_mobile: expected non-empty results.")
    if mobile_results and not _has_token(mobile_results, "samsung"):
        errors.append("brand_mobile: expected Samsung in top results.")

    # 3) Sneaker query should keep category and brand relevance.
    sneakers = results_map["sneaker_budget"]
    sneaker_results = sneakers.get("results", [])
    if sneakers.get("filters", {}).get("category") != "sneakers":
        errors.append("sneaker_budget: expected category=sneakers.")
    if not sneaker_results:
        errors.append("sneaker_budget: expected non-empty results.")
    if sneaker_results and not _has_token(sneaker_results, "nike"):
        errors.append("sneaker_budget: expected Nike in top results.")

    # 4) Unavailable product should communicate unavailability and still return alternatives.
    unavailable = results_map["unavailable_product"]
    message = unavailable.get("message", "")
    unavailable_recs = unavailable.get("recommendations", [])
    if "No exact in-stock match" not in message:
        errors.append("unavailable_product: expected unavailable-product message.")
    if not unavailable_recs:
        errors.append("unavailable_product: expected similar recommendations.")

    # 5) Compare query should classify intent and return recommendation material.
    compare = results_map["compare_mobile"]
    compare_results = compare.get("results", [])
    compare_recs = compare.get("recommendations", [])
    if compare.get("intent") != "compare":
        errors.append("compare_mobile: expected intent=compare.")
    if not compare_results and not compare_recs:
        errors.append("compare_mobile: expected non-empty results or recommendations.")

    # 6) Empty query should not crash and should still return discoverable output.
    empty = results_map["empty_query"]
    if not isinstance(empty.get("results"), list) or not isinstance(empty.get("recommendations"), list):
        errors.append("empty_query: expected list outputs for results/recommendations.")

    # 7) Typo brand query should still return useful recommendations.
    typo = results_map["typo_brand"]
    typo_results = typo.get("results", [])
    typo_recs = typo.get("recommendations", [])
    if not typo_results and not typo_recs:
        errors.append("typo_brand: expected non-empty results or recommendations.")

    # 8) Very low budget query should preserve budget intent and provide fallback suggestions.
    low_budget = results_map["very_low_budget"]
    if low_budget.get("filters", {}).get("max_price") != 50:
        errors.append("very_low_budget: expected max_price=50.")
    if not low_budget.get("recommendations", []):
        errors.append("very_low_budget: expected fallback recommendations.")

    # 9) Very high budget query should preserve min-price constraint and still provide alternatives.
    high_budget = results_map["very_high_budget"]
    if high_budget.get("filters", {}).get("min_price") != 20000:
        errors.append("very_high_budget: expected min_price=20000.")
    if not high_budget.get("recommendations", []):
        errors.append("very_high_budget: expected fallback recommendations.")

    # 10) Compare with no exact catalog match should still classify compare and return alternatives.
    compare_no_exact = results_map["compare_no_exact"]
    if compare_no_exact.get("intent") != "compare":
        errors.append("compare_no_exact: expected intent=compare.")
    if not compare_no_exact.get("recommendations", []) and not compare_no_exact.get("results", []):
        errors.append("compare_no_exact: expected alternatives when exact products are missing.")

    # 11) Follow-up short query should keep refinement context and not be misclassified.
    follow_up_user = 9111
    _run_query("show me laptops under 1500", follow_up_user)
    follow_up = _run_query("more like this under 1000", follow_up_user)
    if follow_up.get("intent") not in {"refine", "search"}:
        errors.append("follow_up: expected refine/search intent.")
    if follow_up.get("filters", {}).get("max_price") != 1000:
        errors.append("follow_up: expected max_price=1000.")
    if not follow_up.get("recommendations", []) and not follow_up.get("results", []):
        errors.append("follow_up: expected recommendations or results.")

    return len(errors) == 0, errors


def main() -> int:
    ok, errors = validate_scenarios()

    if ok:
        print("Agent regression checks passed.")
        return 0

    print("Agent regression checks failed:")
    for err in errors:
        print(f"- {err}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
