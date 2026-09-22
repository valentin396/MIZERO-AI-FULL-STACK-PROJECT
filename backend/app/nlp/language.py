import re

# A simple keyword-scoring heuristic, not a statistical model: count how many
# distinctive function words/markers of each language appear in the message,
# and pick the highest score. Deliberately explainable (every match is a
# literal word) rather than a black box — fits the project's emphasis on
# explainable AI, and needs no extra dependency.

LANG_NAMES = {"en": "English", "rw": "Kinyarwanda", "fr": "French"}

KEYWORDS = {
    "rw": [
        "nabuze", "nabonye", "yanjye", "ejo", "ndashaka", "gushaka", "muraho",
        "cyangwa", "namaze", "natakaje", "narabonye", "byanjye", "uyu", "iyi",
        "ndagushaka", "nyabuneka", "murakoze", "hano", "aho", "ubwo", "kandi",
        "witwa", "ni", "telefoni", "uyumunsi", "ikintu", "gusanga",
    ],
    "fr": [
        "perdu", "trouve", "trouvé", "jai", "j'ai", "mon", "ma", "mes", "hier",
        "aujourdhui", "aujourd'hui", "recherche", "cherche", "objet", "où",
        "ou", "avez-vous", "bonjour", "merci", "perds", "svp",
    ],
    "en": [
        "lost", "found", "my", "yesterday", "today", "looking", "search",
        "near", "the", "i", "have", "was", "is", "phone", "please", "thanks",
        "hello", "hi",
    ],
}

_WORD_RE = {
    lang: [re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE) for w in words]
    for lang, words in KEYWORDS.items()
}


def detect_language(text: str) -> tuple[str, dict]:
    """Returns (language_code, {lang: score}). Falls back to 'en' if there's
    no signal either way (e.g. a very short message)."""
    scores = {lang: 0 for lang in KEYWORDS}
    for lang, patterns in _WORD_RE.items():
        for pattern in patterns:
            if pattern.search(text):
                scores[lang] += 1

    best_lang = max(scores, key=lambda l: scores[l])
    if scores[best_lang] == 0:
        return "en", scores
    return best_lang, scores
