import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Item, Match, Notification, OwnershipVerification
from app.schemas import MatchStatusUpdate
from app.deps import get_current_user, get_current_user_optional
from app.routers.verification import compute_verification

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
def get_match(match_id: int, db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    lost = db.query(Item).filter(Item.id == m.lost_item_id).first()
    found = db.query(Item).filter(Item.id == m.found_item_id).first()

    verification = None
    contact = None
    if user and user.id in (lost.user_id, found.user_id):
        verification = compute_verification(db, m.id)
        if m.status == "confirmed" and verification["passed"]:
            other_user_id = found.user_id if user.id == lost.user_id else lost.user_id
            other = db.query(User).filter(User.id == other_user_id).first()
            contact = {"name": other.name, "phone": other.phone, "email": other.email}

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
        "verification": verification,
        "contact": contact,
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
        _create_verification_rows(db, m, lost, found)
        for uid in (lost.user_id, found.user_id):
            db.add(Notification(
                user_id=uid, match_id=m.id,
                title="Match confirmed",
                message=f'"{lost.title}" and "{found.title}" were confirmed as a match.',
            ))

    db.commit()
    return {"id": m.id, "status": m.status}


def _create_verification_rows(db: Session, m: Match, lost: Item, found: Item):
    """Called when a match is confirmed. If the found-item reporter set
    security questions, create one ownership_verifications row per question,
    assigned to the claimant (the lost-item reporter) — they must answer
    all of them correctly before either side's contact details are shown.
    Idempotent: a match can only be confirmed once meaningfully, but PATCH
    could in principle be called again."""
    already = db.query(OwnershipVerification).filter(OwnershipVerification.match_id == m.id).first()
    if already:
        return
    if not found.verification_questions:
        return
    try:
        questions = json.loads(found.verification_questions)
    except (TypeError, ValueError):
        questions = []
    for q in questions[:3]:
        question = (q.get("question") or "").strip()
        expected = (q.get("expected_answer") or "").strip()
        if not question or not expected:
            continue
        db.add(OwnershipVerification(
            match_id=m.id, user_id=lost.user_id,
            question=question, expected_answer=expected,
        ))
