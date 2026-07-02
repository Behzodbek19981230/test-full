import asyncio
import os
import re
import threading
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.models.broadcast import Broadcast, BotSettings
from app.services import audit_service, telegram_broadcast_service

router = APIRouter(prefix="/announcements", tags=["announcements"])

VALID_TARGETS = ("users", "channel", "both")
ALLOWED_MEDIA_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def _require_admin_role(user: User):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Faqat admin bu amalni bajarishi mumkin")


def _get_settings_row(db: Session) -> BotSettings:
    row = db.query(BotSettings).first()
    if not row:
        row = BotSettings()
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _to_dict(b: Broadcast) -> dict:
    return {
        "id": b.id,
        "message": b.message,
        "target": b.target,
        "status": b.status,
        "media_url": f"/api/uploads/{b.media_path}" if b.media_path else None,
        "media_type": b.media_type,
        "sent_count": b.sent_count,
        "failed_count": b.failed_count,
        "created_at": b.created_at.isoformat() if b.created_at else None,
    }


class SendAnnouncementRequest(BaseModel):
    message: str
    target: str = "users"
    media_path: str | None = None
    media_type: str | None = None


class ChannelSettingsRequest(BaseModel):
    channel_chat_id: str


@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...), user: User = Depends(get_current_admin)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_MEDIA_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Ruxsat etilmagan format. Faqat: {', '.join(ALLOWED_MEDIA_EXTENSIONS)}")

    media_dir = os.path.join(get_settings().UPLOAD_DIR, "announcements")
    os.makedirs(media_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(media_dir, filename)

    content = await file.read()
    if len(content) > get_settings().MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="Fayl hajmi juda katta")
    with open(filepath, "wb") as f:
        f.write(content)

    media_path = f"announcements/{filename}"
    media_type = "animation" if ext == "gif" else "photo"
    return {"media_path": media_path, "media_type": media_type, "url": f"/api/uploads/{media_path}"}


@router.get("")
def list_announcements(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    query = db.query(Broadcast).order_by(Broadcast.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {"items": [_to_dict(b) for b in items], "total": total}


@router.get("/settings")
def get_channel_settings(db: Session = Depends(get_db), user: User = Depends(get_current_admin)):
    row = _get_settings_row(db)
    return {"channel_chat_id": row.channel_chat_id, "channel_title": row.channel_title}


@router.put("/settings")
def update_channel_settings(
    body: ChannelSettingsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    _require_admin_role(user)

    chat_id = body.channel_chat_id.strip()
    if not chat_id:
        raise HTTPException(status_code=400, detail="Kanal chat_id kiritilishi shart")

    try:
        info = asyncio.run(telegram_broadcast_service.get_channel_chat(chat_id))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Kanalga ulanib bo'lmadi. Bot kanalga admin qilib qo'shilganini va chat_id/username to'g'riligini tekshiring",
        )

    row = _get_settings_row(db)
    row.channel_chat_id = str(info["id"])
    row.channel_title = info["title"]
    db.commit()

    audit_service.log_action(db, user.id, "update", "bot_settings", row.id, f"Telegram kanal ulandi: {row.channel_title}")

    return {"channel_chat_id": row.channel_chat_id, "channel_title": row.channel_title}


@router.post("")
def send_announcement(
    body: SendAnnouncementRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_admin),
):
    message = body.message.strip()
    if not re.sub(r"<[^>]+>", "", message).strip():
        raise HTTPException(status_code=400, detail="Xabar matni bo'sh bo'lmasligi kerak")

    if body.target not in VALID_TARGETS:
        raise HTTPException(status_code=400, detail=f"target faqat {', '.join(VALID_TARGETS)} bo'lishi mumkin")

    if body.media_path:
        caption_len = len(telegram_broadcast_service.html_to_telegram_html(message))
        if caption_len > telegram_broadcast_service.CAPTION_MAX_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Rasm/GIF bilan matn {telegram_broadcast_service.CAPTION_MAX_LENGTH} belgidan oshmasligi kerak (hozir {caption_len})",
            )

    channel_chat_id = None
    if body.target in ("channel", "both"):
        settings_row = _get_settings_row(db)
        if not settings_row.channel_chat_id:
            raise HTTPException(status_code=400, detail="Avval Telegram kanal ulanmagan. Sozlamalarda kanal chat_id kiriting")
        channel_chat_id = settings_row.channel_chat_id

    broadcast = Broadcast(
        admin_id=user.id, message=message, target=body.target, status="pending",
        media_path=body.media_path, media_type=body.media_type,
    )
    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)

    audit_service.log_action(db, user.id, "create", "broadcast", broadcast.id, f"E'lon yuborildi ({body.target})")

    threading.Thread(
        target=telegram_broadcast_service.run_broadcast_in_background,
        args=(broadcast.id, message, body.target, channel_chat_id, body.media_path, body.media_type),
        daemon=True,
    ).start()

    return _to_dict(broadcast)
