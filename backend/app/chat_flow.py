from app.rwanda_data import district_names, sectors_for, CATEGORIES

URGENCY_LEVELS = ["Urgent — need it back today", "Important but not urgent", "No rush"]

STEP_ORDER = [
    "GREETING", "ASK_STATUS", "ASK_CATEGORY", "ASK_TITLE", "ASK_DESCRIPTION",
    "ASK_LOCATION", "ASK_LANDMARK", "ASK_DATE", "ASK_URGENCY", "ASK_NAME",
    "ASK_PHONE", "CONFIRM", "DONE",
]

NEXT_STEP = {STEP_ORDER[i]: STEP_ORDER[i + 1] for i in range(len(STEP_ORDER) - 1)}
NEXT_STEP["DONE"] = "DONE"

# The field each step's answer fills in the draft (mirrors apply_answer
# below). Used by resume_step() to skip past slots the free-text NLU parser
# (app/nlp/intent.py) already filled in.
FIELD_FOR_STEP = {
    "GREETING": "status",
    "ASK_STATUS": "category",
    "ASK_CATEGORY": "title",
    "ASK_TITLE": "description",
    "ASK_DESCRIPTION": "location",
    "ASK_LOCATION": "landmark",
    "ASK_LANDMARK": "date_occurred",
    "ASK_DATE": "urgency",
    "ASK_URGENCY": "contact_name",
    "ASK_NAME": "contact_phone",
}


def resume_step(draft: dict) -> str:
    """Given a draft that's already partially filled in (e.g. by free-text
    NLU), find the earliest step whose field is still missing, so the
    scripted flow continues from there instead of re-asking what's known."""
    for step in STEP_ORDER:
        field = FIELD_FOR_STEP.get(step)
        if field is not None and not draft.get(field):
            return step
    return "ASK_PHONE"


def options_for(step: str, draft: dict) -> list[str] | None:
    # Keyed by the step whose *prompt* is currently being shown (matching
    # prompt_for below), not by the step name that sounds related — e.g.
    # prompt_for("ASK_DATE") asks the urgency question, so the urgency
    # buttons belong here, not on "ASK_URGENCY" (whose prompt asks for a
    # name). Getting this pairing wrong previously meant the urgency and
    # final yes/no buttons never showed up.
    if step == "GREETING":
        return ["Lost", "Found"]
    if step == "ASK_STATUS":
        return CATEGORIES
    if step == "ASK_DESCRIPTION":
        return district_names()
    if step == "ASK_LOCATION":
        sectors = sectors_for(draft.get("location", ""))
        return sectors or None
    if step == "ASK_DATE":
        # prompt_for only asks the urgency question for LOST reports — a
        # FOUND report gets an open-ended condition question instead, so
        # there's nothing to offer as quick-reply buttons there.
        return URGENCY_LEVELS if draft.get("status") == "LOST" else None
    if step == "ASK_PHONE":
        return ["Yego (Yes)", "Oya (No)"]
    return None


def prompt_for(step: str, draft: dict) -> str:
    status = draft.get("status")
    if step == "GREETING":
        return ("Muraho! I'm the MIZERO assistant. I'll help you report a lost or "
                "found item in under two minutes. Did you lose something, or find something?")
    if step == "ASK_STATUS":
        return "Got it. What kind of item is it? (e.g. Phone, ID Card, Wallet, Bag, Keys, Laptop, Document, Other)"
    if step == "ASK_CATEGORY":
        return 'Give it a short title — e.g. "Black iPhone 13" or "MTN Mobile Money ID card".'
    if step == "ASK_TITLE":
        return "Describe it with any details that would help someone recognize it (color, brand, marks, contents)."
    if step == "ASK_DESCRIPTION":
        verb = "find" if status == "FOUND" else "lose"
        return f"Which district did you {verb} it in?"
    if step == "ASK_LOCATION":
        sectors = sectors_for(draft.get("location", ""))
        if sectors:
            return f"Which sector of {draft.get('location')}, roughly?"
        return f'Any specific landmark in {draft.get("location")}? (e.g. "near the taxi park") — or type "not sure".'
    if step == "ASK_LANDMARK":
        return "On what date did this happen? (e.g. 2026-08-30)"
    if step == "ASK_DATE":
        return "How urgently do you need it back?" if status == "LOST" else "Anything else worth noting about its condition?"
    if step == "ASK_URGENCY":
        return "What's your name, so we can refer to this report?"
    if step == "ASK_NAME":
        return "And a phone number where the other party (or MIZERO) can reach you?"
    if step == "ASK_PHONE":
        return _summary(draft) + "\n\nShall I submit this report? (yego/oya)"
    if step == "CONFIRM":
        # Not reached in the normal flow — the router now handles the
        # yego/oya answer to the ASK_PHONE prompt directly and moves
        # straight to DONE, since that's the point where the report is
        # actually created. Kept only so this function stays total.
        return "Thanks — your report is live. MIZERO will notify you if a match is found."
    if step == "DONE":
        return "This report is complete. Start a new chat to report another item."
    return ""


def _summary(d: dict) -> str:
    lines = [
        "Here's what I have:",
        f"• Status: {d.get('status')}",
        f"• Category: {d.get('category')}",
        f"• Title: {d.get('title')}",
        f"• Description: {d.get('description')}",
        f"• District: {d.get('location')}",
        f"• Sector/landmark: {d.get('landmark')}",
        f"• Date: {d.get('date_occurred')}",
        f"• Urgency: {d.get('urgency')}",
        f"• Name: {d.get('contact_name')}",
        f"• Phone: {d.get('contact_phone')}",
    ]
    return "\n".join(lines)


def apply_answer(step: str, draft: dict, answer: str) -> tuple[dict, str]:
    text = answer.strip()
    d = dict(draft)

    if step == "GREETING":
        d["status"] = "FOUND" if "found" in text.lower() else "LOST"
    elif step == "ASK_STATUS":
        d["category"] = text
    elif step == "ASK_CATEGORY":
        d["title"] = text
    elif step == "ASK_TITLE":
        d["description"] = text
    elif step == "ASK_DESCRIPTION":
        d["location"] = text
    elif step == "ASK_LOCATION":
        d["landmark"] = text
    elif step == "ASK_LANDMARK":
        d["date_occurred"] = text
    elif step == "ASK_DATE":
        d["urgency"] = text
    elif step == "ASK_URGENCY":
        d["contact_name"] = text
    elif step == "ASK_NAME":
        d["contact_phone"] = text
    # The yego/oya answer to the ASK_PHONE prompt (submit or restart) is
    # handled directly by the router, before this function is ever called
    # for that step.

    return d, NEXT_STEP[step]
