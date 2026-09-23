"""Persistent image storage via Cloudinary, with a local-disk fallback.

Why this exists: item report photos were being saved to a local uploads/
folder and served back from it. That works fine locally, but on Render's
free tier the filesystem is ephemeral -- wiped on every redeploy/restart --
so every uploaded photo eventually 404s in production (confirmed against
the live site: item 27's image_url was a /uploads/<uuid>.jpg path).
Cloudinary keeps uploaded photos across deploys.

Local disk is kept only as a fallback, not the primary path: if
CLOUDINARY_* isn't configured (e.g. local dev without those env vars set)
or a Cloudinary upload fails at runtime, we log a clear warning and save
to disk instead of hard-erroring the report flow -- same "keep working,
warn loudly" pattern as the OpenAI chat fallback in app/llm_chat.py.
"""
import logging
import os
import uuid

import cloudinary
import cloudinary.uploader

logger = logging.getLogger("mizero.image_storage")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

_configured = False


def is_cloudinary_configured() -> bool:
    return bool(
        os.getenv("CLOUDINARY_CLOUD_NAME")
        and os.getenv("CLOUDINARY_API_KEY")
        and os.getenv("CLOUDINARY_API_SECRET")
    )


def _configure_once() -> None:
    global _configured
    if _configured:
        return
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )
    _configured = True


def _save_local(contents: bytes, ext: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}.{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(contents)
    # Served by the /uploads static mount in app/main.py.
    return f"/uploads/{filename}"


def save_image(contents: bytes, ext: str) -> str:
    """Saves an uploaded image and returns its URL: a persistent Cloudinary
    secure_url when credentials are configured and the upload succeeds,
    otherwise a local /uploads/... path (see module docstring)."""
    if not is_cloudinary_configured():
        logger.warning(
            "CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET not set -- saving image to "
            "local disk instead. This will NOT persist across a Render redeploy."
        )
        return _save_local(contents, ext)

    try:
        _configure_once()
        result = cloudinary.uploader.upload(contents, folder="mizero", resource_type="image")
        return result["secure_url"]
    except Exception as e:
        logger.warning("Cloudinary upload failed (%s) -- falling back to local disk for this image.", e)
        return _save_local(contents, ext)
