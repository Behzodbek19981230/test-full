from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin, create_access_token
from app.schemas.auth import LoginRequest, ChangePasswordRequest
from app.services import auth_service, audit_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = auth_service.authenticate_admin(db, body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Noto'g'ri login yoki parol")

    if user.role not in ("admin", "superadmin", "teacher"):
        raise HTTPException(status_code=403, detail="Admin paneliga kirish huquqi yo'q")

    token = create_access_token(user.id)
    audit_service.log_action(db, user.id, "login", "user", user.id, "Tizimga kirdi", request.client.host)

    return {
        "token": token,
        "admin": {"id": user.id, "username": user.login, "full_name": user.full_name, "role": user.role},
    }


@router.get("/me")
def me(user: User = Depends(get_current_admin)):
    return {"id": user.id, "username": user.login, "full_name": user.full_name, "role": user.role}


@router.put("/change-password")
def change_password(body: ChangePasswordRequest, user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not auth_service.change_password(db, user, body.old_password, body.new_password):
        raise HTTPException(status_code=400, detail="Eski parol noto'g'ri")
    return {"message": "Parol muvaffaqiyatli o'zgartirildi"}
