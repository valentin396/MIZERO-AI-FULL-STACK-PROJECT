"""Report-creation and search helpers shared by both chat backends: the
rule-based FSM (app/chat_flow.py + app/routers/chat.py) and the LLM-driven
conversational path (app/llm_chat.py). Keeping this logic in one place means
a report created via a button-driven flow and one created via free-form
conversation with the AI end up identical rows in the database.
"""
from datetime import datetime

from sqlalchemy.orm import Session

from app.matching.text import build_search_text, tokenize
from app.models import Item


def parse_event_date(text: str | None):
    if not text:
        return datetime.utcnow().date()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    return datetime.utcnow().date()


def create_item_from_draft(db: Session, user_id: int, draft: dict) -> Item:
    search_text = build_search_text(
        draft.get("title", ""), draft.get("description", ""), draft.get("category", ""),
        draft.get("location", ""), draft.get("landmark", ""),
    )
    item = Item(
        user_id=user_id,
        status=draft.get("status"),
        category=draft.get("category"),
        title=draft.get("title"),
        description=draft.get("description"),
        location=draft.get("location"),
        landmark=draft.get("landmark"),
        event_date=parse_event_date(draft.get("date_occurred")),
        search_text=search_text,
    )
    # Contact info comes from the account for both chat paths, matching the
    # classic report-form behavior — chat never asks for it separately.
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def search_items(db: Session, query: str, category: str | None, location: str | None, limit: int = 5) -> list[dict]:
    """Only returns fields safe to show a stranger (no user_id, no contact
    info, no verification_questions) — this result set is what both chat
    backends show directly to the user, and what the LLM path also feeds
    back into the model as a tool result."""
    q_tokens = set(tokenize(query or "").split())
    q = db.query(Item)
    if category:
        q = q.filter(Item.category == category)
    if location:
        q = q.filter(Item.location == location)
    candidates = q.order_by(Item.created_at.desc()).limit(200).all()

    scored = []
    for it in candidates:
        it_tokens = set(tokenize(it.search_text or "").split())
        hits = len(q_tokens & it_tokens)
        if hits > 0 or category or location:
            scored.append((hits, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [it for _, it in scored[:limit]]

    return [{
        "id": it.id, "title": it.title, "status": it.status,
        "category": it.category, "location": it.location, "landmark": it.landmark,
    } for it in top]
