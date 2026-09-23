import json
import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ChatSession, ChatMessage
from app.schemas import ChatMessageIn, ChatMessageOut
from app.deps import get_current_user
from app.chat_flow import prompt_for, options_for, apply_answer, resume_step
from app.chat_shared import create_item_from_draft, search_items
from app.routers.items import _run_matching
from app.nlp.language import detect_language, LANG_NAMES
from app.nlp.intent import parse_intent
from app.nlp import replies as nlp_replies
from app.llm_chat import is_llm_available, run_turn, transcribe_audio, LLMUnavailableError

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger("mizero.chat")

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
        # Picked once, at session start: if OPENAI_API_KEY isn't set we go
        # straight to the rule-based FSM and never attempt an OpenAI call at
        # all. An 'llm' session can still drop to 'rule' mid-conversation if
        # a call fails later — see _handle_llm_turn below.
        mode = "llm" if is_llm_available() else "rule"
        session = ChatSession(user_id=user.id, step="GREETING", draft="{}", mode=mode)
        db.add(session)
        db.commit()
        db.refresh(session)
        return ChatMessageOut(
            session_id=session.id, reply=prompt_for("GREETING", {}),
            step="GREETING", options=options_for("GREETING", {}), done=False,
        )

    db.add(ChatMessage(session_id=session.id, sender="user", message=payload.message))
    db.commit()

    if session.mode == "llm":
        return _handle_llm_turn(db, session, user, payload.message)

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

        item = create_item_from_draft(db, user.id, draft)

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
    top = search_items(db, parsed["description"], parsed["category"], parsed["location"])

    intro = nlp_replies.confirm_search(lang, parsed["category"], parsed["location"])
    if top:
        lines = [f"• {it['title']} ({it['status'].title()}, {it['location']}{', ' + it['landmark'] if it['landmark'] else ''})" for it in top]
        reply = intro + "\n" + nlp_replies.results_summary(lang, len(top)) + "\n" + "\n".join(lines)
    else:
        reply = intro + "\n" + nlp_replies.no_results(lang)

    db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
    db.commit()

    return ChatMessageOut(
        session_id=session.id, reply=reply, step="GREETING",
        options=options_for("GREETING", {}), done=False,
        search_results=top, nlu_explain=explain,
    )


def _handle_llm_turn(db: Session, session: ChatSession, user: User, text: str) -> ChatMessageOut:
    if session.step == "DONE":
        # Mirrors the rule-based FSM's NEXT_STEP["DONE"] = "DONE" behavior:
        # once a report is submitted, further messages in this session don't
        # reopen it — without this, a later confirmation-sounding message
        # (e.g. a stray "yego") could walk the model through confirm_report
        # + submit_report again and create a duplicate report.
        reply = prompt_for("DONE", {})
        db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
        db.commit()
        return ChatMessageOut(session_id=session.id, reply=reply, step="DONE", done=True, item_id=session.item_id)

    history = [
        {"role": "user" if m.sender == "user" else "assistant", "content": m.message}
        for m in db.query(ChatMessage).filter(ChatMessage.session_id == session.id)
                    .order_by(ChatMessage.created_at).all()
    ]
    draft = json.loads(session.draft or "{}")

    try:
        result = run_turn(history, draft, db, user.id)
    except LLMUnavailableError:
        logger.warning("OpenAI call failed for chat session %s — falling back to rule-based chat", session.id)
        session.mode = "rule"
        session.step = "GREETING"
        session.draft = "{}"
        db.commit()
        return _handle_free_text(db, session, text)

    session.draft = json.dumps(result["draft"])
    if result["submitted_item_id"]:
        session.step = "DONE"
        session.item_id = result["submitted_item_id"]
        db.commit()
        _run_matching(db)
    else:
        db.commit()

    reply = result["reply"]
    db.add(ChatMessage(session_id=session.id, sender="bot", message=reply))
    db.commit()

    # No rule-based NLU trace exists for LLM replies, so the "Why I
    # understood this" toggle shows the fields the model has extracted so
    # far instead — see ChatBot.jsx.
    explain = [f'{k}="{v}"' for k, v in result["draft"].items() if v and not k.startswith("_")] or None

    return ChatMessageOut(
        session_id=session.id, reply=reply, step=session.step,
        options=None, done=bool(result["submitted_item_id"]),
        item_id=result["submitted_item_id"],
        search_results=result["search_results"], nlu_explain=explain,
    )


ALLOWED_AUDIO_CONTENT_PREFIXES = ("audio/", "video/webm")  # some browsers tag mic recordings as video/webm
MAX_AUDIO_BYTES = 15 * 1024 * 1024


@router.post("/transcribe")
async def transcribe_voice(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    if not is_llm_available():
        raise HTTPException(status_code=503, detail="Voice input isn't available right now.")

    if not file.content_type or not file.content_type.startswith(ALLOWED_AUDIO_CONTENT_PREFIXES):
        raise HTTPException(status_code=400, detail="Please upload an audio recording.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="No audio was received.")
    if len(contents) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail="Recording is too long — please keep it under a minute or two.")

    try:
        text = transcribe_audio(contents, file.filename or "voice.webm", file.content_type)
    except LLMUnavailableError:
        logger.warning("Voice transcription failed for user %s", user.id)
        raise HTTPException(status_code=502, detail="Voice input isn't available right now.")

    return {"text": text}
