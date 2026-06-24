from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.services import auth_service, audit_service

router = APIRouter(prefix="/admins", tags=["admins"])

VALID_ROLES = ("admin", "teacher")


class CreateAdminRequest(BaseModel):
    login: str
    password: str
    full_name: str
    role: str = "teacher"


class UpdateAdminRequest(BaseModel):
    full_name: str | None = None
    role: str | None = None
    password: str | None = None


def _require_admin_role(user: User):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Faqat admin bu amalni bajarishi mumkin")


def _to_dict(u: User) -> dict:
    return {
        "id": u.id,
        "username": u.login,
        "full_name": u.full_name,
        "role": u.role,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("")
def list_admins(db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    _require_admin_role(user)
    admins = db.query(User).filter(User.role.in_(["admin", "superadmin", "teacher"])).order_by(User.created_at.desc()).all()
    return [_to_dict(a) for a in admins]


@router.post("")
def create_admin(body: CreateAdminRequest, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    _require_admin_role(user)

    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role faqat {', '.join(VALID_ROLES)} bo'lishi mumkin")

    existing = db.query(User).filter(User.login == body.login).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu login allaqachon mavjud")

    new_user = User(
        login=body.login,
        password_hash=auth_service._hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit_service.log_action(db, user.id, "create", "user", new_user.id, f"Yangi {body.role} yaratildi: {body.login}", request.client.host)

    return _to_dict(new_user)


@router.put("/{admin_id}")
def update_admin(admin_id: int, body: UpdateAdminRequest, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    _require_admin_role(user)

    target = db.query(User).filter(User.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    if target.role == "superadmin" and user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadminni o'zgartirish mumkin emas")

    if body.full_name is not None:
        target.full_name = body.full_name
    if body.role is not None:
        if body.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Role faqat {', '.join(VALID_ROLES)} bo'lishi mumkin")
        target.role = body.role
    if body.password:
        target.password_hash = auth_service._hash_password(body.password)

    db.commit()
    db.refresh(target)

    audit_service.log_action(db, user.id, "update", "user", admin_id, f"Admin yangilandi: {target.login}", request.client.host)

    return _to_dict(target)


@router.delete("/{admin_id}")
def delete_admin(admin_id: int, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    _require_admin_role(user)

    target = db.query(User).filter(User.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    if target.role == "superadmin":
        raise HTTPException(status_code=403, detail="Superadminni o'chirish mumkin emas")

    if target.id == user.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")

    login_name = target.login
    db.delete(target)
    db.commit()

    audit_service.log_action(db, user.id, "delete", "user", admin_id, f"Admin o'chirildi: {login_name}", request.client.host)

    return {"message": "O'chirildi"}
