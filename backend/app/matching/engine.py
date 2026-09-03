from datetime import date
from app.matching.text import text_similarity_matrix
from app.matching.image import image_similarity

# The exact weights from the project roadmap:
#   final_score = text*0.30 + location*0.25 + time*0.20 + image*0.15 + category*0.10
WEIGHTS = {"text": 0.30, "location": 0.25, "time": 0.20, "image": 0.15, "category": 0.10}


def time_similarity(date_a: date, date_b: date) -> float:
    """1.0 for the same day, decaying linearly to 0 by 30 days apart —
    a real lost/found pair is almost always reported within days of
    each other."""
    if not date_a or not date_b:
        return 0.0
    diff_days = abs((date_a - date_b).days)
    return max(0.0, 1 - diff_days / 30)


def compute_matches(items: list[dict], threshold: float = 0.2) -> list[dict]:
    """items: list of dicts with keys id, status, category, location,
    event_date, search_text, image_hash. Only compares LOST-vs-FOUND
    pairs. Returns a list of match dicts with the full score breakdown,
    sorted by final_score descending.
    """
    texts = [it["search_text"] or "" for it in items]
    sim_matrix = text_similarity_matrix(texts)

    results = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a, b = items[i], items[j]
            if a["status"] == b["status"]:
                continue
            if a["status"] not in ("LOST", "FOUND") or b["status"] not in ("LOST", "FOUND"):
                continue

            text_score = sim_matrix[i][j]
            category_score = 1.0 if (a["category"] or "").lower() == (b["category"] or "").lower() else 0.0
            location_score = 1.0 if (a["location"] or "").lower() == (b["location"] or "").lower() else 0.0
            t_score = time_similarity(a.get("event_date"), b.get("event_date"))

            img_score = None
            if a.get("image_hash") and b.get("image_hash"):
                img_score = image_similarity(a["image_hash"], b["image_hash"])

            if img_score is not None:
                final = (
                    WEIGHTS["text"] * text_score
                    + WEIGHTS["location"] * location_score
                    + WEIGHTS["time"] * t_score
                    + WEIGHTS["image"] * img_score
                    + WEIGHTS["category"] * category_score
                )
            else:
                # Redistribute the image weight proportionally across the
                # other four signals rather than penalizing a report for
                # simply not having a photo attached.
                remaining = 1 - WEIGHTS["image"]
                final = (
                    (WEIGHTS["text"] / remaining) * text_score
                    + (WEIGHTS["location"] / remaining) * location_score
                    + (WEIGHTS["time"] / remaining) * t_score
                    + (WEIGHTS["category"] / remaining) * category_score
                )
            final = min(max(final, 0.0), 1.0)

            if final >= threshold:
                lost = a if a["status"] == "LOST" else b
                found = b if a["status"] == "LOST" else a
                results.append({
                    "lost_item_id": lost["id"],
                    "found_item_id": found["id"],
                    "text_score": round(text_score, 3),
                    "location_score": location_score,
                    "time_score": round(t_score, 3),
                    "image_score": round(img_score, 3) if img_score is not None else None,
                    "category_score": category_score,
                    "final_score": round(final, 3),
                })

    return sorted(results, key=lambda r: r["final_score"], reverse=True)
