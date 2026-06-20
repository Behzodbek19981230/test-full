from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.payment import PaymentAction
from app.services import payment_service, audit_service
from app.models.admin import Admin

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("")
def get_payments(status: str = None, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    return payment_service.get_payments(db, status, page, per_page)


@router.get("/pending/count")
def pending_count(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    return {"count": payment_service.get_pending_count(db)}


@router.put("/{payment_id}/approve")
def approve_payment(payment_id: int, body: PaymentAction, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = payment_service.approve(db, payment_id, admin.id, body.note)
    if not result:
        raise HTTPException(status_code=400, detail="Bu to'lov allaqachon ko'rib chiqilgan")
    audit_service.log_action(db, admin.id, "approve", "payment", payment_id, f"To'lov tasdiqlandi: {result['amount']} so'm", request.client.host)
    return result


@router.put("/{payment_id}/reject")
def reject_payment(payment_id: int, body: PaymentAction, request: Request, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = payment_service.reject(db, payment_id, admin.id, body.note)
    if not result:
        raise HTTPException(status_code=400, detail="Bu to'lov allaqachon ko'rib chiqilgan")
    audit_service.log_action(db, admin.id, "reject", "payment", payment_id, f"To'lov rad etildi: {result['amount']} so'm", request.client.host)
    return result
