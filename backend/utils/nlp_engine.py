import random
import re

# 🔥 DOMAIN KNOWLEDGE
CATEGORY_MAP = {
    "electronics": "electronics",
    "mobile": "mobile",
    "phone": "mobile",
    "smartphone": "mobile",
    "iphone": "mobile",
    "android": "mobile",
    "laptop": "laptop",
    "macbook": "laptop",
    "shoe": "sneakers",
    "sneaker": "sneakers",
    "watch": "accessories",
    "cap": "accessories",
    "bag": "accessories",
    "earbuds": "accessories",
    "headphones": "accessories",
    "shirt": "apparel",
    "hoodie": "apparel",
    "jacket": "apparel",
    "jeans": "apparel",
}

KEYWORD_VARIANTS = {
    "mobile": ["iphone", "samsung", "oneplus", "realme", "redmi", "mobile", "phone", "smartphone"],
    "phone": ["iphone", "samsung", "oneplus", "realme", "redmi", "mobile", "phone", "smartphone"],
    "smartphone": ["iphone", "samsung", "oneplus", "realme", "redmi", "mobile", "phone", "smartphone"],
    "iphone": ["iphone", "apple", "ios", "phone", "mobile"],
    "android": ["samsung", "oneplus", "realme", "redmi", "android", "phone", "mobile"],
    "laptop": ["macbook", "hp", "dell", "lenovo", "laptop", "notebook"],
    "macbook": ["macbook", "laptop", "notebook"],
    "notebook": ["macbook", "hp", "dell", "lenovo", "laptop", "notebook"],
    "watch": ["watch", "smartwatch"],
    "earbuds": ["earbuds", "buds", "airpods", "wireless"],
    "headphones": ["headphones", "headset", "sony", "jbl"],
    "shoe": ["shoe", "sneaker", "nike", "adidas"],
    "sneaker": ["shoe", "sneaker", "nike", "adidas"],
    "apparel": ["hoodie", "shirt", "jacket", "jeans", "apparel", "fashion"],
}

BRANDS = {
    "nike", "adidas", "puma", "reebok", "new", "balance", "apple", "samsung",
    "google", "oneplus", "xiaomi", "sony", "jbl", "gucci", "balenciaga", "prada",
    "dell", "lenovo", "hp", "asus", "acer", "msi", "vivo", "realme", "motorola",
    "nothing", "ray-ban", "oakley", "fossil", "casio", "rolex", "titan", "boat",
}

STOPWORDS = {
    "i", "want", "need", "show", "find", "me", "please", "for", "with", "the", "a", "an",
    "to", "buy", "get", "some", "any", "best", "good", "product", "products", "option", "options",
    "under", "over", "below", "above", "between", "and",
}


def _tokenize(query: str) -> list[str]:
    raw_tokens = re.findall(r"[a-z0-9-]+", query.lower())
    expanded_tokens: list[str] = []
    for token in raw_tokens:
        expanded_tokens.append(token)
        if token.endswith("s") and len(token) > 4:
            expanded_tokens.append(token[:-1])
    return expanded_tokens


def _extract_price_signals(query: str) -> tuple[int | None, int | None]:
    normalized = query.lower().replace(",", "")

    def parse_amount(raw: str) -> int:
        raw = raw.strip().lower().replace("$", "")
        if raw.endswith("k"):
            return int(float(raw[:-1]) * 1000)
        return int(float(raw))

    range_match = re.search(r"between\s*\$?([\d.]+k?)\s*and\s*\$?([\d.]+k?)", normalized)
    if range_match:
        a = parse_amount(range_match.group(1))
        b = parse_amount(range_match.group(2))
        return (min(a, b), max(a, b))

    under_match = re.search(r"(?:under|below|less than|max)\s*\$?([\d.]+k?)", normalized)
    if under_match:
        return (None, parse_amount(under_match.group(1)))

    over_match = re.search(r"(?:over|above|more than|min)\s*\$?([\d.]+k?)", normalized)
    if over_match:
        return (parse_amount(over_match.group(1)), None)

    exact_match = re.search(r"\$([\d.]+k?)", normalized)
    if exact_match:
        exact_value = parse_amount(exact_match.group(1))
        tolerance = max(50, int(exact_value * 0.15))
        return (max(0, exact_value - tolerance), exact_value + tolerance)

    return (None, None)


def detect_intent(query: str):
    q = query.lower()
    tokens = set(_tokenize(q))

    if tokens.intersection({"hi", "hello", "hey"}):
        return "greeting"

    if any(x in q for x in ["not available", "out of stock", "unavailable"]):
        return "availability"

    if any(x in q for x in ["under", "above", "cheap", "expensive"]):
        return "refine"

    if any(x in q for x in ["compare", "vs", "versus"]):
        return "compare"

    if any(x in q for x in ["explore", "browse"]):
        return "explore"

    return "search"


def extract_intent(query: str):
    lowered = query.lower()
    tokens = _tokenize(lowered)

    intent = {
        "category": None,
        "keywords": [],
        "max_price": None,
        "min_price": None,
        "sort": None,
        "brands": [],
    }

    # 🔹 CATEGORY + KEYWORD DETECTION
    for word, category in CATEGORY_MAP.items():
        if word in tokens or re.search(rf"\b{re.escape(word)}\b", lowered):
            intent["category"] = category
            intent["keywords"].append(word)

    for token in tokens:
        if token in BRANDS:
            intent["brands"].append(token)

    # Keep category specific when concrete product class is mentioned.
    if "laptop" in intent["keywords"] or "macbook" in intent["keywords"]:
        intent["category"] = "laptop"
    elif any(k in intent["keywords"] for k in ["mobile", "phone", "smartphone", "iphone", "android"]):
        intent["category"] = "mobile"

    min_price, max_price = _extract_price_signals(lowered)
    intent["min_price"] = min_price
    intent["max_price"] = max_price

    # 🔹 SORT INTENT
    if any(word in lowered for word in ["cheap", "low", "budget", "affordable"]):
        intent["sort"] = "asc"
    elif any(word in lowered for word in ["premium", "expensive", "best", "luxury"]):
        intent["sort"] = "desc"

    # Add query terms as searchable keywords (excluding stopwords and already detected keywords).
    keyword_candidates = [
        token
        for token in tokens
        if token not in STOPWORDS and len(token) > 2 and token not in intent["keywords"]
    ]
    intent["keywords"].extend(keyword_candidates[:6])

    # Keep unique order.
    intent["keywords"] = list(dict.fromkeys(intent["keywords"]))
    intent["brands"] = list(dict.fromkeys(intent["brands"]))

    return intent


def generate_response(intent, results, filters):
    if intent == "greeting":
        return "Hey! Tell me what you're looking for - budget, category, anything!"

    if intent == "compare":
        return "I found options to compare. Check specs, price, and category matches below."

    if not results:
        return "Hmm, I couldn't find an exact match. Try changing price or category."

    templates = [
        "Here are some great picks for you:",
        "I found some solid options you might like:",
        "These match your style and budget:",
    ]

    return random.choice(templates)


def generate_suggestions(filters):
    suggestions = []

    if not filters["max_price"]:
        suggestions.append("Try adding a budget like 'under 1000'")

    if not filters["category"]:
        suggestions.append("You can specify category like sneakers or watches")

    if not filters.get("brands"):
        suggestions.append("Try adding a brand like Nike, Apple, Samsung, or Dell")

    suggestions.append("Try 'premium options' for high-end products")

    return suggestions
