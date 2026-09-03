from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Item, Match
from app.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/statistics")
def statistics(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    users = db.query(User).count()
    lost = db.query(Item).filter(Item.status == "LOST").count()
    found = db.query(Item).filter(Item.status == "FOUND").count()
    matches = db.query(Match).count()
    recovered = db.query(Item).filter(Item.status == "RECOVERED").count()

    top_locations = (
        db.query(Item.location, func.count(Item.id).label("n"))
        .filter(Item.location.isnot(None))
        .group_by(Item.location)
        .order_by(func.count(Item.id).desc())
        .limit(5)
        .all()
    )

    return {
        "users": users,
        "lost_items": lost,
        "found_items": found,
        "matches": matches,
        "recovered": recovered,
        "top_locations": [{"location": loc, "count": n} for loc, n in top_locations],
    }


@router.get("/reports-over-time")
def reports_over_time(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    """Real monthly counts (not mock data) — powers the "Reports Over
    Time" line chart in the admin dashboard."""
    rows = (
        db.query(
            func.to_char(Item.created_at, "YYYY-MM").label("month"),
            func.count(Item.id).label("n"),
        )
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": m, "count": n} for m, n in rows]


@router.get("/users")
def list_users(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.created_at.desc()).limit(200).all()


@router.get("/items")
def list_items(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return db.query(Item).order_by(Item.created_at.desc()).limit(200).all()
