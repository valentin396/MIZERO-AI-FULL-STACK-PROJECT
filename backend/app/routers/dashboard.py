from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import User, Item, Match, Notification
from app.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lost_count = db.query(Item).filter(Item.user_id == user.id, Item.status == "LOST").count()
    found_count = db.query(Item).filter(Item.user_id == user.id, Item.status == "FOUND").count()

    my_item_ids = [i.id for i in db.query(Item.id).filter(Item.user_id == user.id).all()]
    match_count = db.query(Match).filter(
        or_(Match.lost_item_id.in_(my_item_ids), Match.found_item_id.in_(my_item_ids))
    ).count()
    notif_count = db.query(Notification).filter(
        Notification.user_id == user.id, Notification.read_status == False  # noqa: E712
    ).count()

    recent_reports = db.query(Item).filter(Item.user_id == user.id).order_by(
        Item.created_at.desc()
    ).limit(3).all()

    recent_matches_q = db.query(Match).filter(
        or_(Match.lost_item_id.in_(my_item_ids), Match.found_item_id.in_(my_item_ids))
    ).order_by(Match.final_score.desc()).limit(3).all()

    recent_matches = []
    for m in recent_matches_q:
        lost = db.query(Item).filter(Item.id == m.lost_item_id).first()
        found = db.query(Item).filter(Item.id == m.found_item_id).first()
        recent_matches.append({"id": m.id, "final_score": m.final_score, "lost_item": lost, "found_item": found})

    return {
        "lost_count": lost_count,
        "found_count": found_count,
        "match_count": match_count,
        "notification_count": notif_count,
        "recent_reports": recent_reports,
        "recent_matches": recent_matches,
    }
