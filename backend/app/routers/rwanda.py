from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Item
from app.rwanda_data import DISTRICTS, CATEGORIES, coords_for
import hashlib

router = APIRouter(prefix="/api/rwanda", tags=["rwanda"])


@router.get("/districts")
def get_districts():
    return DISTRICTS


@router.get("/categories")
def get_categories():
    return CATEGORIES


@router.get("/popular-areas")
def popular_areas(db: Session = Depends(get_db)):
    """Real counts of reports per district — not invented numbers.
    Only returns districts that actually have at least one report."""
    from sqlalchemy import func

    rows = (
        db.query(Item.location, func.count(Item.id).label("n"))
        .filter(Item.location.isnot(None))
        .group_by(Item.location)
        .order_by(func.count(Item.id).desc())
        .limit(6)
        .all()
    )
    return [{"location": loc, "count": n} for loc, n in rows]


@router.get("/map-items")
def map_items(db: Session = Depends(get_db)):
    """Every open report placed at its district's coordinates, with a
    small deterministic offset (from a hash of the item id) so
    same-district pins don't stack exactly on top of each other."""
    items = db.query(Item).filter(Item.status.in_(["LOST", "FOUND"])).limit(200).all()
    out = []
    for it in items:
        lat, lng = coords_for(it.location or "")
        h = int(hashlib.md5(str(it.id).encode()).hexdigest(), 16)
        dx = ((h % 1000) / 1000 - 0.5) * 0.04
        dy = (((h >> 8) % 1000) / 1000 - 0.5) * 0.04
        out.append({
            "id": it.id, "title": it.title, "status": it.status,
            "category": it.category, "location": it.location, "landmark": it.landmark,
            "lat": lat + dx, "lng": lng + dy,
        })
    return out