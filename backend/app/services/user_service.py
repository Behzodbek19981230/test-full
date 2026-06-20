from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User


def _to_dict(u: User) -> dict:
    return {
        "id": u.id, "telegram_id": u.telegram_id, "username": u.username,
        "full_name": u.full_name, "phone": u.phone, "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def get_users(db: Session, page: int = 1, per_page: int = 20, search: str = "") -> dict:
    query = db.query(User)
    if search:
        query = query.filter(or_(
            User.full_name.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%"),
            User.phone.ilike(f"%{search}%"),
        ))
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "users": [_to_dict(u) for u in users],
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "current_page": page,
    }


def toggle_active(db: Session, user_id: int) -> dict | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return _to_dict(user)
