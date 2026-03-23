import random
import re

# 🔥 DOMAIN KNOWLEDGE
CATEGORY_MAP = {
    "electronics": "electronics",
    "mobile": "mobile",
    "phone": "mobile",
    "smartphone": "mobile",
    "laptop": "laptop",
    "macbook": "electronics",
    "shoe": "sneakers",
    "sneaker": "sneakers",
    "watch": "accessories",
    "cap": "accessories",
    "bag": "accessories",
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
    "shoe": ["shoe", "sneaker", "nike", "adidas"],
    "sneaker": ["shoe", "sneaker", "nike", "adidas"],
}


def detect_intent(query: str):
    q = query.lower()

    if any(x in q for x in ["hi", "hello", "hey"]):
        return "greeting"

    if any(x in q for x in ["under", "above", "cheap", "expensive"]):
        return "refine"

    if any(x in q for x in ["compare", "vs", "versus"]):
        return "compare"

    if any(x in q for x in ["explore", "browse"]):
        return "explore"

    return "search"


def extract_intent(query: str):
    query = query.lower()

    intent = {
        "category": None,
        "keywords": [],
        "max_price": None,
        "min_price": None,
        "sort": None,
    }

    # 🔹 CATEGORY + KEYWORD DETECTION
    for word, category in CATEGORY_MAP.items():
        if word in query:
            intent["category"] = category
            intent["keywords"].append(word)

    # Keep category specific when concrete product class is mentioned.
    if "laptop" in intent["keywords"] or "macbook" in intent["keywords"]:
        intent["category"] = "laptop"
    elif any(k in intent["keywords"] for k in ["mobile", "phone", "smartphone", "iphone", "android"]):
        intent["category"] = "mobile"

    # 🔹 PRICE EXTRACTION (regex = smarter)
    price_match = re.findall(r"\d+", query)
    if price_match:
        price = int(price_match[0])
        if "under" in query or "below" in query:
            intent["max_price"] = price
        elif "above" in query or "over" in query:
            intent["min_price"] = price

    # 🔹 SORT INTENT
    if any(word in query for word in ["cheap", "low", "budget"]):
        intent["sort"] = "asc"
    elif any(word in query for word in ["premium", "expensive", "best"]):
        intent["sort"] = "desc"

    return intent


def generate_response(intent, results, filters):
    if intent == "greeting":
        return "Hey! Tell me what you're looking for - budget, category, anything!"

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

    suggestions.append("Try 'premium options' for high-end products")

    return suggestions
