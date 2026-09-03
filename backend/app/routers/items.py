from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, Item
from app.schemas import ItemCreate, ItemOut, ItemUpdate
from app.deps import get_current_user
from app.matching.text import build_search_text, tokenize
from app.matching.engine import compute_matches

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[ItemOut])
def list_items(
    q: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Item)
    if status:
        query = query.filter(Item.status == status)
    if category:
        query = query.filter(Item.category == category)
    items = query.order_by(Item.created_at.desc()).limit(200).all()

    if not q:
        return items

    q_tokens = set(tokenize(q).split())
    scored = []
    for it in items:
        it_tokens = set(tokenize(it.search_text or "").split())
        hits = len(q_tokens & it_tokens)
        if hits > 0:
            scored.append((hits, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [it for _, it in scored]


@router.post("", response_model=ItemOut, status_code=201)
def create_item(payload: ItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.status not in ("LOST", "FOUND"):
        raise HTTPException(status_code=400, detail="status must be LOST or FOUND")

    search_text = build_search_text(
        payload.title, payload.description, payload.category, payload.location,
        payload.landmark or "", payload.color or "",
    )

    item = Item(
        user_id=user.id,
        status=payload.status,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        color=payload.color,
        location=payload.location,
        landmark=payload.landmark,
        event_date=payload.event_date,
        event_time=payload.event_time,
        image_url=payload.image_url,
        image_hash=payload.image_hash,
        search_text=search_text,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    _run_matching(db)
    return item


@router.get("/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    from app.models import Match

    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    matches = db.query(Match).filter(
        (Match.lost_item_id == item_id) | (Match.found_item_id == item_id)
    ).order_by(Match.final_score.desc()).all()

    suggestions = []
    for m in matches:
        other_id = m.found_item_id if m.lost_item_id == item_id else m.lost_item_id
        other = db.query(Item).filter(Item.id == other_id).first()
        suggestions.append({"match_id": m.id, "score": m.final_score, "status": m.status, "item": other})

    return {"item": item, "suggestions": suggestions}


@router.patch("/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own reports.")

    if payload.status is not None:
        item.status = payload.status
    if payload.image_url is not None:
        item.image_url = payload.image_url
    if payload.image_hash is not None:
        item.image_hash = payload.image_hash

    db.commit()
    db.refresh(item)

    if payload.image_hash is not None:
        _run_matching(db)

    return item


def _run_matching(db: Session):
    """Re-runs the full matching engine and upserts Match rows. Called
    after every new report or photo attachment."""
    from app.models import Match

    items = db.query(Item).filter(Item.status.in_(["LOST", "FOUND"])).all()
    item_dicts = [{
        "id": it.id, "status": it.status, "category": it.category,
        "location": it.location, "event_date": it.event_date,
        "search_text": it.search_text, "image_hash": it.image_hash,
    } for it in items]

    results = compute_matches(item_dicts)

    for r in results:
        existing = db.query(Match).filter(
            Match.lost_item_id == r["lost_item_id"],
            Match.found_item_id == r["found_item_id"],
        ).first()
        if existing:
            existing.text_score = r["text_score"]
            existing.location_score = r["location_score"]
            existing.time_score = r["time_score"]
            existing.image_score = r["image_score"]
            existing.category_score = r["category_score"]
            existing.final_score = r["final_score"]
        else:
            db.add(Match(**r))
    db.commit()
