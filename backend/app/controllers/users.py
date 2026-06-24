from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.services import user_service
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def get_users(page: int = 1, per_page: int = 20, search: str = "", db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return user_service.get_users(db, page, per_page, search)


@router.put("/{user_id}/toggle-active")
def toggle_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return user_service.toggle_active(db, user_id)
