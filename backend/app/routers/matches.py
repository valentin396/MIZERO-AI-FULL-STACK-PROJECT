from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Item, Match, Notification
from app.schemas import MatchStatusUpdate
from app.deps import get_current_user

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("")
def list_matches(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    my_item_ids = [i.id for i in db.query(Item).filter(Item.user_id == user.id).all()]
    matches = db.query(Match).filter(
        (Match.lost_item_id.in_(my_item_ids)) | (Match.found_item_id.in_(my_item_ids))
    ).order_by(Match.final_score.desc()).all()

    out = []
    for m in matches:
        lost = db.query(Item).filter(Item.id == m.lost_item_id).first()
        found = db.query(Item).filter(Item.id == m.found_item_id).first()
        out.append({
            "id": m.id, "final_score": m.final_score, "status": m.status,
            "lost_item": lost, "found_item": found,
        })
    return out


@router.get("/{match_id}")
def get_match(match_id: int, db: Session = Depends(get_db)):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    lost = db.query(Item).filter(Item.id == m.lost_item_id).first()
    found = db.query(Item).filter(Item.id == m.found_item_id).first()
    return {
        "id": m.id,
        "status": m.status,
        "final_score": m.final_score,
        "breakdown": {
            "text": m.text_score, "location": m.location_score,
            "time": m.time_score, "image": m.image_score, "category": m.category_score,
        },
        "lost_item": lost,
        "found_item": found,
    }


@router.patch("/{match_id}")
def update_match(match_id: int, payload: MatchStatusUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")

    lost = db.query(Item).filter(Item.id == m.lost_item_id).first()
    found = db.query(Item).filter(Item.id == m.found_item_id).first()
    if user.id not in (lost.user_id, found.user_id):
        raise HTTPException(status_code=403, detail="You can only act on matches involving your own reports.")

    if payload.status not in ("confirmed", "rejected"):
        raise HTTPException(status_code=400, detail="status must be confirmed or rejected")

    m.status = payload.status
    if payload.status == "confirmed":
        lost.status = "RECOVERED"
        found.status = "RECOVERED"
        for uid in (lost.user_id, found.user_id):
            db.add(Notification(
                user_id=uid, match_id=m.id,
                title="Match confirmed",
                message=f'"{lost.title}" and "{found.title}" were confirmed as a match.',
            ))

    db.commit()
    return {"id": m.id, "status": m.status}
