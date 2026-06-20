import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
from app.config import get_settings

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.get("/{path:path}")
def serve_upload(path: str):
    filepath = os.path.join(get_settings().UPLOAD_DIR, path)
    if not os.path.isfile(filepath):
        return {"error": "Fayl topilmadi"}, 404
    return FileResponse(filepath)
