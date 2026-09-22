from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Item, Match, OwnershipVerification
from app.schemas import VerificationAnswerBatch
from app.deps import get_current_user

router = APIRouter(prefix="/api/matches/{match_id}/verification", tags=["verification"])


def _load_match(db: Session, match_id: int):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    lost = db.query(Item).filter(Item.id == m.lost_item_id).first()
    found = db.query(Item).filter(Item.id == m.found_item_id).first()
    return m, lost, found


def compute_verification(db: Session, match_id: int) -> dict:
    """Shared by this router and app/routers/matches.py so both agree on
    what "passed" means: no questions were ever set (or the match hasn't
    been confirmed yet, so no rows exist) counts as passed, otherwise every
    row must be individually correct."""
    rows = db.query(OwnershipVerification).filter(OwnershipVerification.match_id == match_id).all()
    total = len(rows)
    answered = sum(1 for r in rows if r.user_answer is not None)
    correct = sum(1 for r in rows if r.verified)
    required = total > 0
    passed = (not required) or (correct == total)
    return {"required": required, "total": total, "answered": answered, "correct": correct, "passed": passed}


@router.get("")
def get_pending_questions(match_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m, lost, found = _load_match(db, match_id)
    if user.id not in (lost.user_id, found.user_id):
        raise HTTPException(status_code=403, detail="You can only view verification for your own matches.")

    rows = db.query(OwnershipVerification).filter(OwnershipVerification.match_id == match_id).all()
    is_claimant = user.id == lost.user_id

    questions = []
    for r in rows:
        entry = {"id": r.id, "answered": r.user_answer is not None}
        if is_claimant:
            # Only the claimant ever sees the question text — never
            # expected_answer, which stays on the server.
            entry["question"] = r.question
        questions.append(entry)

    result = compute_verification(db, match_id)
    result["questions"] = questions
    result["is_claimant"] = is_claimant
    return result


@router.post("")
def submit_answers(
    match_id: int, payload: VerificationAnswerBatch,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    m, lost, found = _load_match(db, match_id)
    if user.id != lost.user_id:
        raise HTTPException(status_code=403, detail="Only the person claiming this item can answer its verification questions.")

    rows = db.query(OwnershipVerification).filter(
        OwnershipVerification.match_id == match_id,
        OwnershipVerification.user_id == user.id,
    ).all()
    rows_by_id = {r.id: r for r in rows}

    for a in payload.answers:
        row = rows_by_id.get(a.id)
        if not row:
            continue
        row.user_answer = a.answer
        # Case-insensitive, whitespace-trimmed exact match. A reasonable
        # future improvement would be fuzzy matching (e.g. Levenshtein
        # distance) to tolerate small typos, but exact match keeps the
        # comparison simple and explainable for now.
        row.verified = row.expected_answer.strip().lower() == a.answer.strip().lower()

    db.commit()

    result = compute_verification(db, match_id)
    contact = None
    if result["passed"] and m.status == "confirmed":
        finder = db.query(User).filter(User.id == found.user_id).first()
        contact = {"name": finder.name, "phone": finder.phone, "email": finder.email}
    result["contact"] = contact
    return result
