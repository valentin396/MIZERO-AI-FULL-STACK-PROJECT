import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.database import Base, engine
from app.llm_chat import is_llm_available
from app.routers import auth, items, matches, chat, notifications, upload, rwanda, dashboard, admin, verification

# Without this, our own loggers (mizero.chat, mizero.llm_chat, mizero.startup)
# are silent by default — the root logger's default level is WARNING and
# nothing else in this project configures a handler, so the "falling back to
# rule-based chat" warnings and the startup line below would otherwise never
# actually reach the console.
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Creates tables on startup if they don't exist yet. For iterative
# schema changes during development, prefer a real migration tool
# (Alembic) — kept simple here since this is a fresh project.
Base.metadata.create_all(bind=engine)


def _add_missing_columns():
    """create_all only adds brand-new tables, not columns on tables that
    already exist. This adds any columns introduced after the first deploy
    (currently just items.verification_questions) so existing databases
    don't need a manual migration step."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    if "items" in table_names:
        existing = {c["name"] for c in inspector.get_columns("items")}
        if "verification_questions" not in existing:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE items ADD COLUMN verification_questions TEXT"))

    if "chat_sessions" in table_names:
        existing = {c["name"] for c in inspector.get_columns("chat_sessions")}
        if "mode" not in existing:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN mode VARCHAR(10) DEFAULT 'rule'"))


_add_missing_columns()

app = FastAPI(title="MIZERO API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(items.router)
app.include_router(matches.router)
app.include_router(chat.router)
app.include_router(notifications.router)
app.include_router(upload.router)
app.include_router(rwanda.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(verification.router)

_startup_logger = logging.getLogger("mizero.startup")
if is_llm_available():
    _startup_logger.info("OpenAI key detected — AI chat and voice transcription enabled.")
else:
    _startup_logger.info("No OpenAI key set — chat will use the rule-based assistant only.")


@app.get("/api/health")
def health():
    return {"status": "ok"}
