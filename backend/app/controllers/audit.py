from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.admin import Admin

router = APIRouter(tags=["audit"])


@router.get("/audit-logs")
def get_audit_logs(page: int = 1, per_page: int = 50, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    total = db.query(AuditLog).count()
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return {
        "logs": [{
            "id": l.id, "admin_id": l.admin_id,
            "admin_name": l.admin.full_name if l.admin else "System",
            "action": l.action, "entity_type": l.entity_type, "entity_id": l.entity_id,
            "details": l.details, "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        } for l in logs],
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "current_page": page,
    }


@router.get("/notifications")
def get_notifications(page: int = 1, per_page: int = 20, unread_only: bool = False, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    query = db.query(Notification).filter(Notification.admin_id.isnot(None))
    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    items = query.order_by(Notification.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    unread_count = db.query(Notification).filter(Notification.admin_id.isnot(None), Notification.is_read == False).count()

    return {
        "notifications": [{
            "id": n.id, "user_id": n.user_id, "admin_id": n.admin_id,
            "title": n.title, "message": n.message, "type": n.type, "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        } for n in items],
        "total": total,
        "unread_count": unread_count,
    }


@router.put("/notifications/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}


@router.put("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    db.query(Notification).filter(Notification.admin_id.isnot(None), Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "Barcha bildirishnomalar o'qildi"}
