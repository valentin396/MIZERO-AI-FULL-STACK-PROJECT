import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import auth, items, matches, chat, notifications, upload, rwanda, dashboard, admin

# Creates tables on startup if they don't exist yet. For iterative
# schema changes during development, prefer a real migration tool
# (Alembic) — kept simple here since this is a fresh project.
Base.metadata.create_all(bind=engine)

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


@app.get("/api/health")
def health():
    return {"status": "ok"}
