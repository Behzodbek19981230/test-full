import threading
from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.variant import TestVariant
from app.services.pdf_service import generate_and_send


def _to_dict(p: Payment) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "user": {"id": p.user.id, "full_name": p.user.full_name, "username": p.user.username, "telegram_id": p.user.telegram_id} if p.user else None,
        "subject_id": p.subject_id,
        "subject_name": p.subject.name if p.subject else None,
        "question_count": p.question_count,
        "mode": p.mode,
        "amount": p.amount,
        "screenshot_file_id": f"/api/uploads/{p.screenshot_file_id}" if p.screenshot_file_id else None,
        "status": p.status,
        "admin_id": p.admin_id,
        "admin_note": p.admin_note,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def get_payments(db: Session, status: str = None, page: int = 1, per_page: int = 20) -> dict:
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "payments": [_to_dict(p) for p in payments],
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "current_page": page,
    }


def get_pending_count(db: Session) -> int:
    return db.query(Payment).filter(Payment.status == "pending").count()


def approve(db: Session, payment_id: int, admin_id: int, note: str = "") -> dict | None:
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p or p.status != "pending":
        return None
    p.status = "approved"
    p.admin_id = admin_id
    p.admin_note = note

    notif = Notification(
        user_id=p.user_id, admin_id=admin_id, title="To'lov tasdiqlandi",
        message=f'"{p.subject.name}" fani uchun {p.question_count} ta test to\'lovingiz tasdiqlandi!',
        type="payment",
    )
    db.add(notif)
    db.commit()
    db.refresh(p)

    variant = TestVariant(
        payment_id=p.id, user_id=p.user_id, subject_id=p.subject_id,
        question_count=p.question_count, status="pending",
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    telegram_id = p.user.telegram_id if p.user else None
    if telegram_id:
        vid = variant.id
        subject_name = p.subject.name if p.subject else "Test"
        subject_id = p.subject_id
        question_count = p.question_count
        threading.Thread(
            target=generate_and_send,
            args=(vid, telegram_id, subject_name, subject_id, question_count),
            daemon=True,
        ).start()

    return _to_dict(p)


def reject(db: Session, payment_id: int, admin_id: int, note: str = "") -> dict | None:
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p or p.status != "pending":
        return None
    p.status = "rejected"
    p.admin_id = admin_id
    p.admin_note = note or "To'lov rad etildi"

    notif = Notification(
        user_id=p.user_id, admin_id=admin_id, title="To'lov rad etildi",
        message=f'"{p.subject.name}" fani uchun to\'lovingiz rad etildi. Sabab: {p.admin_note}',
        type="payment",
    )
    db.add(notif)
    db.commit()
    db.refresh(p)
    return _to_dict(p)
