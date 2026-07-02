import asyncio
import io
import logging
import os
import re

from app.config import get_settings
from app.database import SessionLocal
from app.models.user import User
from app.models.broadcast import Broadcast

logger = logging.getLogger(__name__)

CAPTION_MAX_LENGTH = 1024

_INLINE_TAG_MAP = {
    "strong": "b", "b": "b",
    "em": "i", "i": "i",
    "u": "u",
    "s": "s", "strike": "s", "del": "s",
    "code": "code",
    "pre": "pre",
    "blockquote": "blockquote",
}


def html_to_telegram_html(html: str) -> str:
    """RichEditor (Tiptap) HTML -> Telegram parse_mode=HTML matnga o'giradi.

    Telegram faqat b/i/u/s/code/pre/blockquote/a teglarini qo'llab-quvvatlaydi,
    shuning uchun p/ul/li/h1-6/img kabi teglar matn va yangi qatorlarga aylantiriladi.
    """
    text = html or ""

    text = re.sub(r'<span[^>]*data-latex="([^"]*)"[^>]*>.*?</span>', r"<code>\1</code>", text, flags=re.DOTALL)
    text = re.sub(r"<img[^>]*>", "", text)

    text = re.sub(r"<li[^>]*>", "• ", text)
    text = re.sub(r"</li>", "\n", text)
    text = re.sub(r"</?(ul|ol)[^>]*>", "", text)

    text = re.sub(r"<h[1-6][^>]*>", "<b>", text)
    text = re.sub(r"</h[1-6]>", "</b>\n\n", text)

    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"</p>\s*<p[^>]*>", "\n\n", text)
    text = re.sub(r"</?p[^>]*>", "", text)

    text = re.sub(
        r"<(strong|b|em|i|u|s|strike|del|code|pre|blockquote)>",
        lambda m: f"<{_INLINE_TAG_MAP[m.group(1).lower()]}>",
        text, flags=re.IGNORECASE,
    )
    text = re.sub(
        r"</(strong|b|em|i|u|s|strike|del|code|pre|blockquote)>",
        lambda m: f"</{_INLINE_TAG_MAP[m.group(1).lower()]}>",
        text, flags=re.IGNORECASE,
    )
    text = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>', r'<a href="\1">', text)

    text = re.sub(r"<(?!/?(b|i|u|s|code|pre|blockquote|a)(?:\s|>|/))[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


async def _send_one(bot, chat_id, html_message: str, media_bytes: bytes | None, media_type: str | None) -> bool:
    try:
        caption = html_to_telegram_html(html_message)
        if media_bytes:
            file = io.BytesIO(media_bytes)
            file.name = "animation.gif" if media_type == "animation" else "photo.jpg"
            if media_type == "animation":
                await bot.send_animation(chat_id=chat_id, animation=file, caption=caption, parse_mode="HTML")
            else:
                await bot.send_photo(chat_id=chat_id, photo=file, caption=caption, parse_mode="HTML")
        else:
            await bot.send_message(chat_id=chat_id, text=caption, parse_mode="HTML")
        return True
    except Exception as e:
        logger.warning(f"Broadcast xabar yuborilmadi (chat_id={chat_id}): {e}")
        return False


async def get_channel_chat(channel_chat_id: str) -> dict:
    """Kanal bilan bog'lanishni tekshiradi va nomini qaytaradi."""
    from telegram import Bot

    token = get_settings().TELEGRAM_BOT_TOKEN
    bot = Bot(token=token)
    chat = await bot.get_chat(chat_id=channel_chat_id)
    return {"id": chat.id, "title": chat.title or chat.username or str(chat.id)}


async def _run_broadcast(
    broadcast_id: int, message: str, target: str, channel_chat_id: str | None,
    media_path: str | None, media_type: str | None,
):
    from telegram import Bot

    token = get_settings().TELEGRAM_BOT_TOKEN
    sent, failed = 0, 0

    media_bytes: bytes | None = None
    if media_path:
        full_path = os.path.join(get_settings().UPLOAD_DIR, media_path)
        if os.path.isfile(full_path):
            with open(full_path, "rb") as f:
                media_bytes = f.read()

    if token:
        bot = Bot(token=token)

        if target in ("channel", "both") and channel_chat_id:
            ok = await _send_one(bot, channel_chat_id, message, media_bytes, media_type)
            sent += 1 if ok else 0
            failed += 0 if ok else 1

        if target in ("users", "both"):
            db = SessionLocal()
            try:
                telegram_ids = [
                    uid for (uid,) in db.query(User.telegram_id)
                    .filter(User.telegram_id.isnot(None))
                    .all()
                ]
            finally:
                db.close()

            for telegram_id in telegram_ids:
                ok = await _send_one(bot, telegram_id, message, media_bytes, media_type)
                sent += 1 if ok else 0
                failed += 0 if ok else 1
                await asyncio.sleep(0.05)

    db = SessionLocal()
    try:
        row = db.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
        if row:
            row.sent_count = sent
            row.failed_count = failed
            if failed == 0 and sent > 0:
                row.status = "sent"
            elif sent == 0:
                row.status = "failed"
            else:
                row.status = "partial"
            db.commit()
    finally:
        db.close()


def run_broadcast_in_background(
    broadcast_id: int, message: str, target: str, channel_chat_id: str | None,
    media_path: str | None = None, media_type: str | None = None,
):
    try:
        asyncio.run(_run_broadcast(broadcast_id, message, target, channel_chat_id, media_path, media_type))
    except Exception as e:
        logger.error(f"Broadcast xatolik: {e}")
        db = SessionLocal()
        try:
            row = db.query(Broadcast).filter(Broadcast.id == broadcast_id).first()
            if row:
                row.status = "failed"
                db.commit()
        finally:
            db.close()
