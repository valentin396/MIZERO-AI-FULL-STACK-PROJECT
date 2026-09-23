from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.deps import get_current_user
from app.models import User
from app.matching.image import compute_image_hash
from app.image_storage import save_image

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("")
async def upload_photo(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    contents = await file.read()
    if len(contents) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 8MB.")

    ext = (file.content_type.split("/")[-1] or "jpg").replace("jpeg", "jpg")
    url = save_image(contents, ext)
    image_hash = compute_image_hash(contents)

    return {"url": url, "hash": image_hash}
