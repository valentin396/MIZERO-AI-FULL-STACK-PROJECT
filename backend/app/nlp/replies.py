# Small hand-written reply templates per language — kept separate from
# intent.py so extraction logic and presentation don't mix. Only three
# languages, matching what detect_language can distinguish.

_GENERIC_ITEM = {"en": "item", "rw": "ikintu", "fr": "objet"}
_GENERIC_ITEMS = {"en": "items", "rw": "ibintu", "fr": "objets"}

# Display names for app.rwanda_data.CATEGORIES, so a chat reply matches the
# language the user wrote in instead of always showing the English DB value
# (the same idea as frontend/src/services/i18n.js, just for chat replies).
# Kinyarwanda/French wording here is a reasonable best effort, not a
# native-speaker review — worth double-checking if exact phrasing matters.
CATEGORY_NAMES = {
    "Smartphone": {"en": "smartphone", "rw": "telefoni", "fr": "téléphone"},
    "Laptop": {"en": "laptop", "rw": "mudasobwa", "fr": "ordinateur portable"},
    "Tablet": {"en": "tablet", "rw": "itabure", "fr": "tablette"},
    "Earphones": {"en": "earphones", "rw": "ikoresho cyo kwumva", "fr": "écouteurs"},
    "Smartwatch": {"en": "smartwatch", "rw": "isaha ngendanwa", "fr": "montre connectée"},
    "National ID": {"en": "national ID", "rw": "indangamuntu", "fr": "carte d'identité"},
    "Passport": {"en": "passport", "rw": "pasiporo", "fr": "passeport"},
    "Driving License": {"en": "driving license", "rw": "uruhushya rwo gutwara", "fr": "permis de conduire"},
    "Student ID": {"en": "student ID", "rw": "ikarita y'umunyeshuri", "fr": "carte d'étudiant"},
    "Bank Card": {"en": "bank card", "rw": "ikarita ya banki", "fr": "carte bancaire"},
    "Backpack": {"en": "backpack", "rw": "agasagi", "fr": "sac à dos"},
    "Wallet": {"en": "wallet", "rw": "ipochi", "fr": "portefeuille"},
    "Keys": {"en": "keys", "rw": "urufunguzo", "fr": "clés"},
    "Clothes": {"en": "clothes", "rw": "imyenda", "fr": "vêtements"},
    "Jewelry": {"en": "jewelry", "rw": "imitako", "fr": "bijoux"},
    "Other": {"en": "item", "rw": "ikintu", "fr": "objet"},
}


def category_display(category: str | None, lang: str, plural: bool = False) -> str:
    if not category:
        return (_GENERIC_ITEMS if plural else _GENERIC_ITEM).get(lang, _GENERIC_ITEM["en"])
    names = CATEGORY_NAMES.get(category)
    if not names:
        return category.lower()
    return names.get(lang, names["en"])


def confirm_report(lang: str, action: str, category: str | None, location: str | None, landmark: str | None) -> str:
    cat_word = category_display(category, lang)
    where = f"{landmark}, {location}" if landmark else location

    if action == "lost":
        templates = {
            "en": f"Got it — sounds like you lost a {cat_word}" + (f" in {where}" if where else "") +
                  ". Let me get a few more details so we can log it properly.",
            "rw": f"Ndabyumvise — bisa naho watakaje {cat_word}" + (f" i {where}" if where else "") +
                  ". Reka mbaze ibindi bike kugira ngo tubyandike neza.",
            "fr": f"Compris — on dirait que vous avez perdu un(e) {cat_word}" + (f" à {where}" if where else "") +
                  ". Je vais vous demander quelques détails en plus.",
        }
    else:
        templates = {
            "en": f"Got it — sounds like you found a {cat_word}" + (f" in {where}" if where else "") +
                  ". Let's get it logged so the owner can find it.",
            "rw": f"Ndabyumvise — bisa naho wabonye {cat_word}" + (f" i {where}" if where else "") +
                  ". Reka twandike kugira ngo nyir'ikintu abimenye.",
            "fr": f"Compris — on dirait que vous avez trouvé un(e) {cat_word}" + (f" à {where}" if where else "") +
                  ". Enregistrons-le pour que le propriétaire puisse le retrouver.",
        }
    return templates.get(lang, templates["en"])


def confirm_search(lang: str, category: str | None, location: str | None) -> str:
    cat_word = category_display(category, lang, plural=True)
    templates = {
        "en": f"Let me search for {cat_word}" + (f" in {location}" if location else "") + "…",
        "rw": f"Reka nshakishe {cat_word}" + (f" i {location}" if location else "") + "…",
        "fr": f"Je recherche des {cat_word}" + (f" à {location}" if location else "") + "…",
    }
    return templates.get(lang, templates["en"])


def results_summary(lang: str, n: int) -> str:
    templates = {
        "en": f"I found {n} report{'s' if n != 1 else ''} that might match:",
        "rw": f"Nabonye raporo {n} zishobora guhura na ibyo:",
        "fr": f"J'ai trouvé {n} signalement{'s' if n != 1 else ''} qui pourraient correspondre :",
    }
    return templates.get(lang, templates["en"])


def no_results(lang: str) -> str:
    templates = {
        "en": "I couldn't find anything matching that yet. Want to file a report instead?",
        "rw": "Nta kintu mbonye kihuye na ibyo. Waba ushaka kwandika raporo aho kubigenza?",
        "fr": "Je n'ai rien trouvé qui corresponde pour l'instant. Voulez-vous plutôt faire un signalement ?",
    }
    return templates.get(lang, templates["en"])


def clarify_action(lang: str) -> str:
    templates = {
        "en": "I want to make sure I understand — did you lose something, find something, "
              "or are you searching for an existing report?",
        "rw": "Ndashaka kumva neza — waratakaje ikintu, wabonye ikintu, cyangwa urashaka "
              "gushakisha raporo isanzweho?",
        "fr": "Je veux être sûr de bien comprendre — avez-vous perdu quelque chose, trouvé "
              "quelque chose, ou cherchez-vous un signalement existant ?",
    }
    return templates.get(lang, templates["en"])


_FIELD_WORDS = {
    "category": {"en": "what kind of item it is", "rw": "ikintu ni ikihe", "fr": "de quel type d'objet il s'agit"},
    "location": {"en": "where this happened", "rw": "aho ibi byabereye", "fr": "où cela s'est passé"},
}
_JOINER = {"en": " and ", "rw": " na ", "fr": " et "}


def clarify_details(lang: str, missing: list[str]) -> str:
    parts = [_FIELD_WORDS[m][lang if lang in ("en", "rw", "fr") else "en"] for m in missing if m in _FIELD_WORDS]
    joined = _JOINER.get(lang, _JOINER["en"]).join(parts) if parts else _FIELD_WORDS["category"][lang if lang in ("en", "rw", "fr") else "en"]
    templates = {
        "en": f"Could you tell me {joined}?",
        "rw": f"Waba wambwira {joined}?",
        "fr": f"Pouvez-vous me dire {joined} ?",
    }
    return templates.get(lang, templates["en"])
