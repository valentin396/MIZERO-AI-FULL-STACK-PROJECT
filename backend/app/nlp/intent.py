import re
from datetime import date, timedelta
from app.rwanda_data import DISTRICTS, district_names

# Rule-based/keyword + regex entity extraction, on purpose — see
# backend/app/routers/chat.py and the project README for why this avoids an
# external LLM: no API key/cost, and every extracted field can be traced
# back to the exact word that triggered it (the `explain` list below).

SEARCH_CUES = [
    "looking for", "anyone seen", "does anyone have", "search for",
    "searching for", "have you seen",
    "ndashaka", "gushakisha", "hari ushobora", "ese hari", "reba niba",
    "je cherche", "recherche", "quelqu'un a-t-il vu", "avez-vous vu",
]

LOST_CUES = [
    "lost", "lose", "missing",
    "nabuze", "yaratakaye", "natakaje",
    "perdu", "perds", "j'ai perdu", "jai perdu",
]

FOUND_CUES = [
    "found", "find",
    "nabonye", "narabonye",
    "trouvé", "trouve", "j'ai trouvé", "jai trouve",
]

CATEGORY_SYNONYMS = {
    "Smartphone": ["phone", "smartphone", "telefone", "telefoni", "itelefoni",
                   "mobile", "iphone", "samsung", "téléphone", "telephone"],
    "Laptop": ["laptop", "mudasobwa", "ordinateur", "pc", "notebook"],
    "Tablet": ["tablet", "tablette", "ipad"],
    "Earphones": ["earphones", "headphones", "earbuds", "airpods", "écouteurs", "ecouteurs"],
    "Smartwatch": ["smartwatch", "watch", "isaha", "montre"],
    "National ID": ["national id", "indangamuntu", "id card", "carte d'identite",
                     "carte d'identité", "carte nationale"],
    "Passport": ["passport", "pasiporo", "passeport"],
    "Driving License": ["driving license", "driver's license", "uruhushya", "permis"],
    "Student ID": ["student id", "ikarita y'umunyeshuri", "carte etudiant", "carte d'étudiant"],
    "Bank Card": ["bank card", "atm card", "ikarita ya banki", "carte bancaire", "carte de banque"],
    "Backpack": ["backpack", "bag", "sac", "isakoshi", "umufuka"],
    "Wallet": ["wallet", "ipochi", "portefeuille"],
    "Keys": ["keys", "key", "urufunguzo", "clés", "cles", "clé", "cle"],
    "Clothes": ["clothes", "imyenda", "vetements", "vêtements"],
    "Jewelry": ["jewelry", "jewellery", "imitako", "bijoux"],
}

TODAY_WORDS = ["today", "uyu munsi", "uyumunsi", "aujourd'hui", "aujourdhui"]
YESTERDAY_WORDS = ["yesterday", "ejo", "hier"]


def _sector_index() -> dict:
    idx = {}
    for d in DISTRICTS:
        for s in d.get("sectors", []):
            idx[s.lower()] = d["name"]
    return idx


_SECTOR_TO_DISTRICT = _sector_index()
_DISTRICT_NAMES = district_names()


def _find_cue(text_lower: str, cues: list[str]) -> str | None:
    for cue in cues:
        if " " in cue or "'" in cue:
            if cue in text_lower:
                return cue
        elif re.search(rf"\b{re.escape(cue)}\b", text_lower):
            return cue
    return None


def detect_action(text_lower: str) -> tuple[str | None, str | None]:
    cue = _find_cue(text_lower, SEARCH_CUES)
    if cue:
        return "search", cue
    cue = _find_cue(text_lower, LOST_CUES)
    if cue:
        return "lost", cue
    cue = _find_cue(text_lower, FOUND_CUES)
    if cue:
        return "found", cue
    return None, None


def detect_category(text_lower: str) -> tuple[str | None, str | None]:
    for category, synonyms in CATEGORY_SYNONYMS.items():
        cue = _find_cue(text_lower, synonyms)
        if cue:
            return category, cue
    return None, None


def detect_location(text: str) -> tuple[str | None, str | None, str | None]:
    """Sectors are checked first since they're more specific and also pin
    down the parent district (e.g. "Remera" -> landmark=Remera, district=Gasabo)."""
    for sector_lower, district in _SECTOR_TO_DISTRICT.items():
        if re.search(rf"\b{re.escape(sector_lower)}\b", text, re.IGNORECASE):
            return district, sector_lower.title(), sector_lower
    for d in _DISTRICT_NAMES:
        if re.search(rf"\b{re.escape(d.lower())}\b", text, re.IGNORECASE):
            return d, None, d.lower()
    return None, None, None


def detect_date(text_lower: str) -> tuple[str | None, str | None]:
    for w in YESTERDAY_WORDS:
        if w in text_lower:
            return (date.today() - timedelta(days=1)).isoformat(), w
    for w in TODAY_WORDS:
        if w in text_lower:
            return date.today().isoformat(), w
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text_lower)
    if m:
        return m.group(1), m.group(1)
    return None, None


def parse_intent(text: str) -> dict:
    text_lower = text.lower()
    action, action_cue = detect_action(text_lower)
    category, category_cue = detect_category(text_lower)
    location, landmark, location_cue = detect_location(text)
    event_date, date_cue = detect_date(text_lower)

    explain = []
    confidence = 0.0
    if action:
        confidence += 0.45
        explain.append(f'action="{action}" (matched "{action_cue}")')
    if category:
        confidence += 0.25
        explain.append(f'category="{category}" (matched "{category_cue}")')
    if location:
        where = f'location="{location}"' + (f', landmark="{landmark}"' if landmark else "")
        confidence += 0.2
        explain.append(f'{where} (matched "{location_cue}")')
    if event_date:
        confidence += 0.1
        explain.append(f'date="{event_date}" (matched "{date_cue}")')
    if len(text.strip()) < 6:
        confidence = 0.0

    missing = []
    if action in ("lost", "found"):
        if not category:
            missing.append("category")
        if not location:
            missing.append("location")

    return {
        "action": action,
        "category": category,
        "location": location,
        "landmark": landmark,
        "event_date": event_date,
        "title": text.strip()[:80],
        "description": text.strip(),
        "confidence": round(min(confidence, 1.0), 2),
        "missing": missing,
        "explain": explain,
    }
