from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.services import variant_service
from app.models.admin import Admin

router = APIRouter(prefix="/variants", tags=["variants"])


class StatusUpdate(BaseModel):
    status: str


@router.get("")
def get_variants(status: str = None, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    return variant_service.get_variants(db, status, page, per_page)


@router.put("/{variant_id}/status")
def update_variant_status(variant_id: int, body: StatusUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = variant_service.update_status(db, variant_id, body.status)
    if not result:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    return result


@router.post("/{variant_id}/resend")
def resend_variant(variant_id: int, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = variant_service.resend(db, variant_id)
    if not result:
        raise HTTPException(status_code=404, detail="Variant topilmadi")
    return result
