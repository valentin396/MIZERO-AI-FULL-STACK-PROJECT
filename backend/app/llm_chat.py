"""Conversational AI chat path, built on OpenAI's Chat Completions API.

This is the "upgrade" path used when OPENAI_API_KEY is set: open-ended,
multi-turn conversation in English/Kinyarwanda/French about lost or found
items. It sits next to (not instead of) the rule-based FSM in
app/chat_flow.py — see app/routers/chat.py for how a session picks one path
and falls back to the other if OpenAI is unavailable or a call fails.

Reliability for the parts that matter (what item, what category, what
location, when to actually write to the database) comes from OpenAI
function-calling/tool-use, not from parsing the model's prose: the model can
only affect the database or return search results by calling one of the
three tools below, with arguments validated against a fixed schema.
"""
import json
import logging
import os
import re

from openai import OpenAI, OpenAIError
from sqlalchemy.orm import Session

from app.chat_shared import create_item_from_draft, search_items
from app.rwanda_data import CATEGORIES, district_for_sector, district_names

logger = logging.getLogger("mizero.llm_chat")

MODEL = "gpt-4o-mini"
TRANSCRIBE_MODEL = "whisper-1"
MAX_COMPLETION_TOKENS = 400
REQUEST_TIMEOUT_SECONDS = 15.0
MAX_HISTORY_MESSAGES = 16
MAX_TOOL_ROUNDS = 4  # caps cost/latency if the model keeps calling tools instead of replying

REQUIRED_SUBMIT_FIELDS = ["status", "category", "title", "description", "location"]

# The only keys record_fields/submit_report are allowed to write into the
# draft — filters out anything else the model puts in a tool call's
# arguments (including "_confirmed", the internal gate below), so a
# hallucinated or adversarial argument can never forge confirmation.
ALLOWED_DRAFT_FIELDS = {"status", "category", "title", "description", "location", "landmark", "date_occurred"}

# submit_report is only allowed to create a report once this key is True on
# the draft, and the ONLY way it becomes True is the confirm_report handler
# below finding an affirmative word in the user's own last message — not
# just the model claiming the user confirmed. This is a code-level gate:
# the system prompt still asks the model to follow this sequence, but
# submit_report enforces it regardless of what the model does or says.
CONFIRM_FLAG = "_confirmed"

# Deliberately coarse (en/rw/fr affirmatives) — this is a hardening check on
# top of the model's own judgment, not a full NLU pass. A false positive
# just means an easy confirmation goes through a beat early; a false
# negative just means the model has to ask the user to say it more plainly.
CONFIRM_PATTERN = re.compile(
    r"\b(yes|yeah|yep|yup|sure|correct|confirm(ed)?|submit|go ahead|do it|"
    r"yego|yemera|yemeye|nyemeye|"
    r"oui|d'accord|daccord|confirme)\b",
    re.IGNORECASE,
)

_client: OpenAI | None = None


class LLMUnavailableError(Exception):
    """Raised whenever the OpenAI call can't be completed — no API key,
    timeout, rate limit, malformed response, etc. — so the caller can fall
    back to the rule-based FSM instead of breaking the chat."""


def is_llm_available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            timeout=REQUEST_TIMEOUT_SECONDS,
            max_retries=1,
        )
    return _client


def _system_prompt() -> str:
    categories = ", ".join(CATEGORIES)
    districts = ", ".join(district_names())
    return (
        "You are the MIZERO assistant, the conversational chat inside MIZERO, "
        "Rwanda's lost-and-found platform. You help people who lost something, "
        "found something, or want to search for an existing report.\n\n"
        "Speak whichever of English, Kinyarwanda, or French the user writes in, "
        "and switch if they switch. Keep replies short and warm — this is a chat "
        "widget, not an essay.\n\n"
        f"Item categories in MIZERO's database: {categories}.\n"
        f"Rwanda districts (the only valid values for 'location'): {districts}.\n\n"
        "Your job, in order:\n"
        "1. Figure out if the user lost something, found something, or is "
        "searching for an existing report.\n"
        "2. If they're searching, call search_reports with what they've described. "
        "Only tell them about items that come back from that tool — never invent "
        "or guess at reports that might exist.\n"
        "3. If they're filing a report (lost or found), gather: item category, a "
        "short title, a fuller description (color/brand/marks), the district it "
        "happened in, ideally a landmark/sector, and a rough date. Ask ONE natural "
        "follow-up question at a time for whatever is still missing — don't dump "
        "a checklist. Call record_fields whenever you learn or correct a field, "
        "even if the report is still incomplete, so nothing gets lost.\n"
        "4. Once you have at least category, title, description, and location: "
        "show the user a short plain-language summary of what you have and ask "
        "them to confirm (yes/yego/oui) before doing anything else. Do not call "
        "any tool in this step — just ask and wait for their reply.\n"
        "5. Only once the user's very next message clearly confirms, call "
        "confirm_report, then call submit_report with the final fields in the "
        "same turn. If confirm_report's result says the confirmation wasn't "
        "recognized, ask the user to confirm again in plain words instead of "
        "calling submit_report. Never call submit_report without a successful "
        "confirm_report first, and never call either one twice for the same "
        "report.\n\n"
        "Only ever talk about what's in this conversation or what a tool result "
        "just gave you — never reference other users' contact details, other "
        "conversations, or anything not returned by search_reports."
    )


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "record_fields",
            "description": (
                "Save or update the lost/found report fields learned so far from "
                "the conversation, even if the report is still incomplete. Call "
                "this whenever the user gives new or corrected information."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["LOST", "FOUND"]},
                    "category": {"type": "string", "enum": CATEGORIES},
                    "title": {"type": "string", "description": "Short title, e.g. 'Black iPhone 13'."},
                    "description": {"type": "string", "description": "Color, brand, marks, contents."},
                    "location": {"type": "string", "enum": district_names(), "description": "The district."},
                    "landmark": {"type": "string", "description": "Sector or specific landmark within the district."},
                    "date_occurred": {"type": "string", "description": "Rough date, e.g. YYYY-MM-DD, 'today', 'yesterday'."},
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_reports",
            "description": (
                "Search MIZERO's existing lost/found reports. Use this when the "
                "user wants to find something they lost or asks whether anyone "
                "reported finding it — not when they're filing their own report."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Free-text keywords describing the item."},
                    "category": {"type": "string", "enum": CATEGORIES},
                    "location": {"type": "string", "enum": district_names()},
                },
                "required": ["query"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "confirm_report",
            "description": (
                "Mark the report as confirmed by the user. Call this ONLY in "
                "the same turn where the user's message explicitly confirms "
                "the summary you just showed them (e.g. 'yes', 'yego', 'oui', "
                "'confirm', 'submit it'). This does not create the report by "
                "itself — call submit_report right after, in the same turn, "
                "once this succeeds."
            ),
            "parameters": {"type": "object", "properties": {}, "additionalProperties": False},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "submit_report",
            "description": (
                "Create the final report in MIZERO's database. This will be "
                "REJECTED unless confirm_report was already called successfully "
                "for this report — always call confirm_report first. Requires "
                "status, category, title, description, and location at minimum."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["LOST", "FOUND"]},
                    "category": {"type": "string", "enum": CATEGORIES},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "location": {"type": "string", "enum": district_names()},
                    "landmark": {"type": "string"},
                    "date_occurred": {"type": "string"},
                },
                "required": ["status", "category", "title", "description", "location"],
                "additionalProperties": False,
            },
        },
    },
]


def _reconcile_location(draft: dict) -> None:
    """The model's 'location' (district) is a guess from its own geography
    knowledge and, per real testing, an unreliable one (it mapped Remera to
    Kicukiro as often as it got the real answer, Gasabo). If 'landmark'
    names a known sector, that sector's real district — exact data, not a
    guess — overrides whatever the model put in 'location'."""
    correct_district = district_for_sector(draft.get("landmark"))
    if correct_district and draft.get("location") != correct_district:
        draft["location"] = correct_district


def run_turn(history: list[dict], draft: dict, db: Session, user_id: int) -> dict:
    """Runs one user turn of the LLM-driven conversation.

    `history` is the full message list so far as {"role", "content"} dicts
    (oldest first, no system prompt) — the caller trims it, this function
    only takes the most recent slice. `draft` is the report fields extracted
    in earlier turns (from ChatSession.draft), passed back to the model as
    context so it doesn't re-ask what it already knows.

    Returns {"reply": str, "draft": dict, "search_results": list | None,
    "submitted_item_id": int | None}.

    Raises LLMUnavailableError if the OpenAI call can't be completed, so the
    router can fall back to the rule-based FSM instead of failing the chat.
    """
    client = _get_client()
    messages = [{"role": "system", "content": _system_prompt()}]
    visible_draft = {k: v for k, v in draft.items() if k in ALLOWED_DRAFT_FIELDS and v}
    if visible_draft:
        messages.append({
            "role": "system",
            "content": "Fields already recorded from earlier turns: " + json.dumps(visible_draft),
        })
    messages.extend(history[-MAX_HISTORY_MESSAGES:])

    search_results = None
    submitted_item_id = None

    for _ in range(MAX_TOOL_ROUNDS):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                max_completion_tokens=MAX_COMPLETION_TOKENS,
                temperature=0.3,
                user=f"mizero-user-{user_id}",
            )
        except OpenAIError as e:
            logger.warning("OpenAI chat completion failed, falling back to rule-based chat: %s", e)
            raise LLMUnavailableError(str(e)) from e

        if response.usage:
            logger.info(
                "OpenAI chat usage: prompt=%d completion=%d total=%d (model=%s)",
                response.usage.prompt_tokens, response.usage.completion_tokens,
                response.usage.total_tokens, MODEL,
            )

        message = response.choices[0].message
        tool_calls = message.tool_calls or []

        if not tool_calls:
            reply = (message.content or "").strip()
            if not reply:
                logger.warning("OpenAI returned an empty reply with no tool calls")
                raise LLMUnavailableError("empty reply")
            return {
                "reply": reply,
                "draft": draft,
                "search_results": search_results,
                "submitted_item_id": submitted_item_id,
            }

        messages.append({
            "role": "assistant",
            "content": message.content,
            "tool_calls": [
                {"id": tc.id, "type": "function",
                 "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                for tc in tool_calls
            ],
        })

        for tc in tool_calls:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}

            if tc.function.name == "record_fields":
                changed = False
                for k, v in args.items():
                    if k in ALLOWED_DRAFT_FIELDS and v:
                        draft[k] = v
                        changed = True
                _reconcile_location(draft)
                # New/changed info means any earlier confirmation was for a
                # summary that's now stale — require a fresh one.
                if changed and draft.get(CONFIRM_FLAG):
                    draft[CONFIRM_FLAG] = False
                result = {"ok": True}

            elif tc.function.name == "search_reports":
                results = search_items(db, args.get("query", ""), args.get("category"), args.get("location"))
                search_results = results
                # Only ever the safe, already-filtered fields go back to the
                # model — same shape a stranger would see on the item page.
                result = {"results": results}

            elif tc.function.name == "confirm_report":
                # The code-level gate: this only succeeds if the user's own
                # latest message (not the model's say-so) reads as an
                # affirmative. history's last entry is always this turn's
                # user message — see _handle_llm_turn in routers/chat.py.
                last_user_text = next(
                    (m["content"] for m in reversed(history) if m.get("role") == "user"), ""
                )
                if CONFIRM_PATTERN.search(last_user_text or ""):
                    draft[CONFIRM_FLAG] = True
                    result = {"ok": True}
                else:
                    draft[CONFIRM_FLAG] = False
                    result = {
                        "ok": False,
                        "error": "The user's last message doesn't read as an explicit yes/confirmation. "
                                 "Ask them to confirm in plain words before calling this again.",
                    }

            elif tc.function.name == "submit_report":
                for k, v in args.items():
                    if k in ALLOWED_DRAFT_FIELDS and v:
                        draft[k] = v
                _reconcile_location(draft)
                missing = [f for f in REQUIRED_SUBMIT_FIELDS if not draft.get(f)]
                if missing:
                    result = {"ok": False, "error": f"Missing required fields: {', '.join(missing)}"}
                elif not draft.get(CONFIRM_FLAG):
                    result = {
                        "ok": False,
                        "error": "Not confirmed yet — call confirm_report first and only retry "
                                 "submit_report if it succeeds.",
                    }
                else:
                    item = create_item_from_draft(db, user_id, draft)
                    submitted_item_id = item.id
                    draft[CONFIRM_FLAG] = False
                    result = {"ok": True, "item_id": item.id}

            else:
                result = {"error": "unknown tool"}

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result),
            })

    # Exhausted MAX_TOOL_ROUNDS without the model producing a final text
    # reply — treat as a soft failure so the caller falls back rather than
    # the user seeing nothing happen.
    logger.warning("LLM chat exceeded max tool-call rounds without a final reply")
    raise LLMUnavailableError("max tool rounds exceeded")


def transcribe_audio(contents: bytes, filename: str, content_type: str | None) -> str:
    """Transcribes a recorded voice message via OpenAI's Whisper API.

    Language is left on auto-detect rather than forced: Whisper's `language`
    parameter only accepts a single ISO-639-1 code and Kinyarwanda isn't one
    of its officially supported languages, so forcing a language would do
    more harm than good for a multilingual (en/rw/fr) audience. A prompt hint
    nudges decoding instead.
    """
    client = _get_client()
    try:
        result = client.audio.transcriptions.create(
            model=TRANSCRIBE_MODEL,
            file=(filename, contents, content_type or "audio/webm"),
            response_format="text",
            prompt="The speaker may talk in English, Kinyarwanda, or French about losing or finding an item in Rwanda.",
        )
    except OpenAIError as e:
        logger.warning("OpenAI transcription failed: %s", e)
        raise LLMUnavailableError(str(e)) from e
    return str(result).strip()
