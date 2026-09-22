import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User, ChatSession, ChatMessage, Item
from app.schemas import ChatMessageIn, ChatMessageOut
from app.deps import get_current_user
from app.chat_flow import prompt_for, options_for, apply_answer, resume_step
from app.matching.text import build_search_text, tokenize
from app.routers.items import _run_matching
from app.nlp.language import detect_language, LANG_NAMES
from app.nlp.intent import parse_intent
from app.nlp import replies as nlp_replies

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Below this, free-text is treated as too ambiguous to act on — the bot asks
# a clarifying question instead of guessing.
CONFIDENCE_THRESHOLD = 0.45


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

    if step == "ASK_PHONE":
        # This is the answer to the "Shall I submit this report? (yego/oya)"
        # prompt shown at the ASK_PHONE step (see chat_flow.prompt_for) —
        # handling it here, at the step that actually asked the question,
        # is what makes "your report is live" true when the bot says it.
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

    # Only treat input as free text for NLU when the bot is at its opening
    # question and the message isn't one of the quick-reply button labels —
    # everywhere else in the scripted flow, a typed answer is just the
    # answer to whatever was asked (e.g. a title or a phone number), not a
    # sentence to run intent extraction on.
    current_options = options_for(step, draft) or []
    if step == "GREETING" and payload.message.strip() not in current_options:
        return _handle_free_text(db, session, payload.message)

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


def _handle_free_text(db: Session, session: ChatSession, text: str) -> ChatMessageOut:
    lang, lang_scores = detect_language(text)
    parsed = parse_intent(text)
    explain = [
        f'language="{LANG_NAMES[lang]}" (scores en={lang_scores["en"]}, rw={lang_scores["rw"]}, fr={lang_scores["fr"]})',
        *parsed["explain"],
    ]

    if parsed["action"] == "search":
        return _handle_search(db, session, lang, parsed, explain)

    if parsed["action"] in ("lost", "found") and parsed["confidence"] >= CONFIDENCE_THRESHOLD:
        draft = {
            "status": "FOUND" if parsed["action"] == "found" else "LOST",
            "title": parsed["title"],
            "description": parsed["description"],
        }
        for field in ("category", "location", "landmark"):
            if parsed[field]:
                draft[field] = parsed[field]
        if parsed["event_date"]:
            draft["date_occurred"] = parsed["event_date"]

        next_step = resume_step(draft)
        session.step = next_step
        session.draft = json.dumps(draft)
        db.commit()

        confirmation = nlp_replies.confirm_report(lang, parsed["action"], parsed["category"], draft.get("location"), draft.get("landmark"))
        reply = f"{confirmation}\n\n{prompt_for(next_step, draft)}"
        db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
        db.commit()
        return ChatMessageOut(
            session_id=session.id, reply=reply, step=next_step,
            options=options_for(next_step, draft), done=False, nlu_explain=explain,
        )

    # Low confidence, or an action we couldn't pin down at all — ask a
    # clarifying question in the same language rather than guessing, and
    # stay put so the next message is tried again from scratch.
    if not parsed["action"]:
        reply = nlp_replies.clarify_action(lang)
    else:
        reply = nlp_replies.clarify_details(lang, parsed["missing"] or ["category", "location"])
    db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
    db.commit()
    return ChatMessageOut(
        session_id=session.id, reply=reply, step="GREETING",
        options=options_for("GREETING", {}), done=False, nlu_explain=explain,
    )


def _handle_search(db: Session, session: ChatSession, lang: str, parsed: dict, explain: list[str]) -> ChatMessageOut:
    q_tokens = set(tokenize(parsed["description"]).split())
    query = db.query(Item)
    if parsed["category"]:
        query = query.filter(Item.category == parsed["category"])
    if parsed["location"]:
        query = query.filter(Item.location == parsed["location"])
    candidates = query.order_by(Item.created_at.desc()).limit(200).all()

    scored = []
    for it in candidates:
        it_tokens = set(tokenize(it.search_text or "").split())
        hits = len(q_tokens & it_tokens)
        if hits > 0 or parsed["category"] or parsed["location"]:
            scored.append((hits, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [it for _, it in scored[:5]]

    intro = nlp_replies.confirm_search(lang, parsed["category"], parsed["location"])
    if top:
        lines = [f"• {it.title} ({it.status.title()}, {it.location}{', ' + it.landmark if it.landmark else ''})" for it in top]
        reply = intro + "\n" + nlp_replies.results_summary(lang, len(top)) + "\n" + "\n".join(lines)
    else:
        reply = intro + "\n" + nlp_replies.no_results(lang)

    db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
    db.commit()

    results = [{
        "id": it.id, "title": it.title, "status": it.status,
        "category": it.category, "location": it.location, "landmark": it.landmark,
    } for it in top]
    return ChatMessageOut(
        session_id=session.id, reply=reply, step="GREETING",
        options=options_for("GREETING", {}), done=False,
        search_results=results, nlu_explain=explain,
    )


def _parse_date(text: str | None):
    if not text:
        return datetime.utcnow().date()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    return datetime.utcnow().date()
