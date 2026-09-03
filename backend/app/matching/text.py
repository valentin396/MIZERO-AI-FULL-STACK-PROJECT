import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Stopwords across English, French, and Kinyarwanda — the three
# languages a real report is likely to mix.
STOPWORDS = {
    "the", "a", "an", "is", "was", "were", "in", "on", "at", "of", "to",
    "and", "or", "it", "i", "my", "me", "with", "near", "by", "for",
    "this", "that", "am", "be", "has", "have", "had", "found", "lost",
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "je", "mon",
    "ma", "mes", "ai", "suis", "dans", "sur", "avec",
    "na", "ni", "mu", "ku", "kuri", "nabuze", "nabonye", "yanjye", "cyangwa",
}


def tokenize(text: str) -> str:
    """Cleans text for TF-IDF: lowercase, strip punctuation, drop stopwords.
    Returns a space-joined string (what TfidfVectorizer expects)."""
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [t for t in text.split() if len(t) > 1 and t not in STOPWORDS]
    return " ".join(tokens)


def build_search_text(title: str, description: str, category: str, location: str,
                       landmark: str = "", color: str = "") -> str:
    return " ".join(filter(None, [title, description, category, location, landmark, color]))


def text_similarity_matrix(documents: list[str]) -> list[list[float]]:
    """TF-IDF weights each word by how often it appears in one report,
    discounted by how common it is across all reports — so "black" or
    "bag" matter less than "Nyabugogo" or "passport". Cosine similarity
    then measures how close two reports' resulting word-vectors are.
    Returns a full pairwise similarity matrix (0..1) over `documents`.
    """
    cleaned = [tokenize(d) for d in documents]
    if not any(cleaned):
        return [[0.0] * len(documents) for _ in documents]
    vectorizer = TfidfVectorizer()
    try:
        matrix = vectorizer.fit_transform(cleaned)
    except ValueError:
        # All documents were empty after cleaning
        return [[0.0] * len(documents) for _ in documents]
    sims = cosine_similarity(matrix)
    return sims.tolist()
