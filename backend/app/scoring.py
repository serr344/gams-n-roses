def calculate_user_score(placed_item_count: int) -> int:
    base_score = 50
    bonus = min(placed_item_count * 8, 40)
    return base_score + bonus
