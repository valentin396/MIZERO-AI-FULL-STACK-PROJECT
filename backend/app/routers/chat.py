import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User, ChatSession, ChatMessage, Item
from app.schemas import ChatMessageIn, ChatMessageOut
from app.deps import get_current_user
from app.chat_flow import prompt_for, options_for, apply_answer
from app.matching.text import build_search_text
from app.routers.items import _run_matching

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatMessageOut)
def chat(payload: ChatMessageIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == payload.session_id, ChatSession.user_id == user.id
        ).first()

    if not session:
        session = ChatSession(user_id=user.id, step="GREETING", draft="{}")
        db.add(session)
        db.commit()
        db.refresh(session)
        return ChatMessageOut(
            session_id=session.id, reply=prompt_for("GREETING", {}),
            step="GREETING", options=options_for("GREETING", {}), done=False,
        )

    db.add(ChatMessage(session_id=session.id, sender="user", message=payload.message))

    step = session.step
    draft = json.loads(session.draft)

    if step == "CONFIRM":
        yes = payload.message.strip().lower().startswith(("y", "yego"))
        if not yes:
            session.step = "GREETING"
            session.draft = "{}"
            db.commit()
            reply = "No problem — let's start over. " + prompt_for("GREETING", {})
            db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
            db.commit()
            return ChatMessageOut(session_id=session.id, reply=reply, step="GREETING",
                                   options=options_for("GREETING", {}), done=False)

        search_text = build_search_text(
            draft.get("title", ""), draft.get("description", ""), draft.get("category", ""),
            draft.get("location", ""), draft.get("landmark", ""),
        )
        item = Item(
            user_id=user.id,
            status=draft.get("status"),
            category=draft.get("category"),
            title=draft.get("title"),
            description=draft.get("description"),
            location=draft.get("location"),
            landmark=draft.get("landmark"),
            event_date=_parse_date(draft.get("date_occurred")),
            search_text=search_text,
        )
        # Contact info comes from the account, matching the classic
        # report-form behavior — the chat never asks for it separately.
        db.add(item)
        db.commit()
        db.refresh(item)

        session.step = "DONE"
        session.item_id = item.id
        db.commit()

        _run_matching(db)

        reply = prompt_for("DONE", draft) + f"\n\nReport ID: {item.id}"
        db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
        db.commit()
        return ChatMessageOut(session_id=session.id, reply=reply, step="DONE", done=True, item_id=item.id)

    next_draft, next_step = apply_answer(step, draft, payload.message)
    session.step = next_step
    session.draft = json.dumps(next_draft)
    db.commit()

    reply = prompt_for(next_step, next_draft)
    db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
    db.commit()

    return ChatMessageOut(
        session_id=session.id, reply=reply, step=next_step,
        options=options_for(next_step, next_draft), done=(next_step == "DONE"),
    )


@router.get("/history")
def chat_history(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user.id).first()
    if not session:
        return []
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()


def _parse_date(text: str | None):
    if not text:
        return datetime.utcnow().date()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    return datetime.utcnow().date()
