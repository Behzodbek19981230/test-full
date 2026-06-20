from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.subject import SubjectCreate, SubjectUpdate
from app.services import subject_service, audit_service
from app.models.admin import Admin
from app.config import get_settings
import os
import uuid

router = APIRouter(prefix="/subjects", tags=["subjects"])

ALLOWED_EXTENSIONS = {"svg", "png", "jpg", "jpeg", "webp"}


@router.get("")
def get_subjects(db: Session = Depends(get_db)):
    return subject_service.get_all(db, active_only=True)


@router.get("/all")
def get_all_subjects(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    return subject_service.get_all(db)


@router.get("/{subject_id}")
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    result = subject_service.get_by_id(db, subject_id)
    if not result:
        raise HTTPException(status_code=404, detail="Fan topilmadi")
    return result


@router.post("", status_code=201)
def create_subject(body: SubjectCreate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = subject_service.create(db, body.model_dump())
    audit_service.log_action(db, admin.id, "create", "subject", result["id"], f'Fan yaratildi: {result["name"]}', request.client.host)
    return result


@router.put("/{subject_id}")
def update_subject(subject_id: int, body: SubjectUpdate, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = subject_service.update(db, subject_id, body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Fan topilmadi")
    audit_service.log_action(db, admin.id, "update", "subject", subject_id, f'Fan yangilandi: {result["name"]}', request.client.host)
    return result


@router.delete("/{subject_id}")
def delete_subject(subject_id: int, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if not subject_service.soft_delete(db, subject_id):
        raise HTTPException(status_code=404, detail="Fan topilmadi")
    audit_service.log_action(db, admin.id, "delete", "subject", subject_id, "Fan o'chirildi", request.client.host)
    return {"message": "Fan o'chirildi"}


@router.post("/upload-icon")
async def upload_icon(icon: UploadFile = File(...), admin: Admin = Depends(get_current_admin)):
    ext = icon.filename.rsplit(".", 1)[-1].lower() if icon.filename and "." in icon.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Ruxsat etilmagan format. Faqat: {', '.join(ALLOWED_EXTENSIONS)}")

    icons_dir = os.path.join(get_settings().UPLOAD_DIR, "icons")
    os.makedirs(icons_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(icons_dir, filename)

    content = await icon.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/api/uploads/icons/{filename}", "filename": filename}
