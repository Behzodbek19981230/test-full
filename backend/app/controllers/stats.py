from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.services import stats_service
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return stats_service.get_dashboard(db)


@router.get("/public")
def public_stats(db: Session = Depends(get_db)):
    return stats_service.get_public(db)
