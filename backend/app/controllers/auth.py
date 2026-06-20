from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin, create_access_token
from app.schemas.auth import LoginRequest, ChangePasswordRequest
from app.services import auth_service, audit_service
from app.models.admin import Admin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = auth_service.authenticate_admin(db, body.username, body.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Noto'g'ri login yoki parol")

    token = create_access_token(admin.id)
    audit_service.log_action(db, admin.id, "login", "admin", admin.id, "Admin tizimga kirdi", request.client.host)

    return {
        "token": token,
        "admin": {"id": admin.id, "username": admin.username, "full_name": admin.full_name},
    }


@router.get("/me")
def me(admin: Admin = Depends(get_current_admin)):
    return {"id": admin.id, "username": admin.username, "full_name": admin.full_name}


@router.put("/change-password")
def change_password(body: ChangePasswordRequest, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not auth_service.change_password(db, admin, body.old_password, body.new_password):
        raise HTTPException(status_code=400, detail="Eski parol noto'g'ri")
    return {"message": "Parol muvaffaqiyatli o'zgartirildi"}
