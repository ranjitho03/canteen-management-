def recommend_menu(user_history):
    if "Pizza" in user_history:
        return "Try Garlic Bread!"
    return "Try today's special Meal Combo!"


def suggest_from_query(query: str, menu_items: list[dict]):
    text = (query or "").lower()
    if not menu_items:
        return "No menu available now. Please check back in a while."

    spicy_keywords = ["spicy", "hot", "masala"]
    drink_keywords = ["drink", "juice", "tea", "coffee", "cool"]
    tiffen_keywords = ["breakfast", "tiffen", "light"]
    healthy_keywords = ["healthy", "light", "diet"]

    target_category = None
    if any(word in text for word in drink_keywords):
        target_category = "drink"
    elif any(word in text for word in spicy_keywords):
        target_category = "snack"
    elif any(word in text for word in tiffen_keywords):
        target_category = "tiffen"
    elif "lunch" in text:
        target_category = "lunch"

    filtered = menu_items
    if target_category:
        filtered = [item for item in menu_items if item["category"] == target_category]

    if any(word in text for word in healthy_keywords):
        filtered = sorted(filtered, key=lambda item: item["price"])[:3]

    if not filtered:
        filtered = menu_items[:3]
    else:
        filtered = filtered[:3]

    picks = ", ".join([f"{item['name']} (₹{item['price']})" for item in filtered])
    return f"DMI AI Suggestion: Try {picks}."