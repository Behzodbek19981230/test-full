from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.material import Material
from app.models.admin import Admin
from app.config import get_settings
import os
import uuid
import shutil

router = APIRouter(prefix="/materials", tags=["materials"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "png", "jpg", "jpeg"}


def _to_dict(m: Material) -> dict:
    return {
        "id": m.id,
        "subject_id": m.subject_id,
        "title": m.title,
        "description": m.description,
        "file_path": m.file_path,
        "file_name": m.file_name,
        "file_size": m.file_size,
        "file_type": m.file_type,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


@router.get("/{subject_id}")
def get_materials(subject_id: int, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    materials = db.query(Material).filter(Material.subject_id == subject_id).order_by(Material.created_at.desc()).all()
    return [_to_dict(m) for m in materials]


@router.post("/{subject_id}")
async def upload_material(
    subject_id: int,
    title: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Ruxsat etilmagan format. Faqat: {', '.join(ALLOWED_EXTENSIONS)}")

    materials_dir = os.path.join(get_settings().UPLOAD_DIR, "materials", str(subject_id))
    os.makedirs(materials_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(materials_dir, filename)

    file_size = 0
    try:
        with open(filepath, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    f.close()
                    os.remove(filepath)
                    raise HTTPException(status_code=413, detail="Fayl hajmi 50 MB dan oshmasligi kerak")
                f.write(chunk)
    except HTTPException:
        raise
    except Exception:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail="Faylni saqlashda xatolik")

    material = Material(
        subject_id=subject_id,
        title=title,
        description=description or None,
        file_path=f"materials/{subject_id}/{filename}",
        file_name=file.filename or filename,
        file_size=file_size,
        file_type=ext,
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return _to_dict(material)


@router.delete("/{subject_id}/{material_id}")
def delete_material(subject_id: int, material_id: int, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    m = db.query(Material).filter(Material.id == material_id, Material.subject_id == subject_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material topilmadi")

    filepath = os.path.join(get_settings().UPLOAD_DIR, m.file_path)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(m)
    db.commit()
    return {"ok": True}
