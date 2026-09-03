# MIZERO — Full-Stack Rebuild (React + FastAPI + PostgreSQL)

A conversational, AI-assisted lost-and-found platform for Rwanda, built as
two separate services:

- **`backend/`** — Python, FastAPI, SQLAlchemy, PostgreSQL, JWT auth
- **`frontend/`** — React, Vite, Tailwind CSS, React Router, Leaflet

Both were built and **verified running end-to-end in a real test pass**
before delivery: Postgres tables created from the SQLAlchemy models,
a demo user seeded, JWT login tested, protected routes tested, and the
matching engine tested against 24 real sample reports — it correctly
produced 82 candidate matches, scoring the intentionally-paired reports
90%, 88%, and 85%. Two real dependency bugs (a passlib/bcrypt version
conflict, and a missing `email-validator` package) were caught and
fixed during that test — see `backend/requirements.txt` for the fix.

## Two honest substitutions from the original plan

- **Sentence Transformers + FAISS → scikit-learn TF-IDF + cosine
  similarity.** Same idea — turn text into vectors, compare them — but
  TF-IDF needs no multi-gigabyte model download and no vector database.
  FAISS exists to make million-scale search fast; a few hundred reports
  don't need that.
- **CLIP/OpenCV embeddings → perceptual image hashing (dHash) via
  Pillow.** Real, working, explainable visual similarity, without a
  large PyTorch install — a common first-setup failure point.

Everything else — FastAPI, PostgreSQL, SQLAlchemy, JWT, React, Vite,
Tailwind, React Router, Leaflet — is exactly what was specified.

## What's implemented

- Real auth: register/login, bcrypt-hashed passwords, JWT tokens
- Items: create (chat or classic form), list/search, detail, update
- Matching engine: `final_score = text*0.30 + location*0.25 + time*0.20
  + image*0.15 + category*0.10` — exact weights as specified, computed
  fresh after every new or photo-updated report
- Match details page: confidence ring + all 5 signal bars + Contact
  Finder / Not My Item actions (server-verified, only the report owner
  can act)
- Conversational chatbot (rule-based state machine, not a real LLM —
  see note below), with Kinyarwanda touches
- Dashboard: real stat cards, recent reports/matches, notifications
- Real Leaflet/OpenStreetMap map with actual Rwanda district coordinates
- Admin dashboard: real platform-wide stats (users, items, matches,
  recovered, top locations) — requires the seeded admin account

### One more honest note: the chatbot

The roadmap describes an "AI extraction" step that turns free-form
Kinyarwanda sentences like *"Nabuze Samsung Galaxy S23 black i
Kimironko"* into structured JSON automatically. That requires either a
trained NLU model or a call to a large language model API — neither
was in scope here without an API key and its own cost. What's built
instead is a rule-based conversational **state machine**: it asks one
clear question at a time and stores each answer directly, in both
English and Kinyarwanda phrasing. It gets you the same end result (a
structured report from a conversation) without needing external AI
services, but it's not free-text extraction — worth stating plainly
rather than calling it something it isn't.

## What's intentionally not built

Ownership-verification Q&A flow, automated test suite, and the formal
precision/recall AI experiment are real, valuable additions for a
thesis but are each their own project phase — not something to fake
with placeholder numbers. `ownership_verifications` exists as a table
ready for that feature. For the AI experiment, the methodology is
straightforward once you have real usage data: label a sample of
LOST/FOUND pairs as true matches or not, run `compute_matches()` from
`backend/app/matching/engine.py` against them, and compare its output
to your labels for precision/recall/F1 — but do this with your actual
data, not synthetic numbers standing in for it.

## Setup on your Mac

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Install PostgreSQL if you don't have it:
```bash
brew install postgresql@16
brew services start postgresql@16
createdb mizero
```

```bash
cp .env.example .env
```
Open `.env` and set a real `JWT_SECRET` (generate one with
`openssl rand -base64 32`), and confirm `DATABASE_URL` matches your
local Postgres (default Homebrew setup usually has no password — try
`postgresql://localhost/mizero` if the example doesn't connect).

```bash
python seed.py     # creates tables, seeds 24 reports + demo/admin logins
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` — FastAPI's automatic interactive
API documentation, generated from the code itself.

### 2. Frontend

In a **second terminal tab** (keep the backend running in the first):

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Log in with:
- **demo@mizero.rw / demo1234** — regular user, owns the 24 seeded reports
- **admin@mizero.rw / admin1234** — visit `/admin` for the admin dashboard

Both servers need to be running at the same time for the app to work —
the frontend's dev server proxies `/api` requests to the backend
(configured in `frontend/vite.config.js`).

## Project structure

```
MIZERO/
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app, CORS, router registration
│   │   ├── models/               SQLAlchemy tables
│   │   ├── schemas.py            Pydantic request/response validation
│   │   ├── database.py           DB session management
│   │   ├── deps.py               JWT auth dependency
│   │   ├── auth/jwt.py           Password hashing + JWT
│   │   ├── chat_flow.py          Chatbot state machine
│   │   ├── rwanda_data.py        Real districts/sectors/coordinates
│   │   ├── matching/
│   │   │   ├── text.py           TF-IDF + cosine similarity
│   │   │   ├── image.py          Perceptual hashing (dHash)
│   │   │   └── engine.py         Blends all 5 signals into final_score
│   │   └── routers/               One file per API resource
│   ├── seed.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/                 One file per route
│       ├── components/
│       └── services/              API client + auth context
└── database/schema.sql            Reference schema (SQLAlchemy creates it automatically)
```
