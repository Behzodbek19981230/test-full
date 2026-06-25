import threading
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.config import get_settings
import requests as http_requests

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "Sen Test Market platformasining yordamchi botisan. "
    "Test Market — DTM va attestatsiyaga tayyorlanish platformasi. "
    "Platformada barcha fanlar bo'yicha testlar, majburiy fanlar bloki, "
    "Telegram bot orqali test ishlash imkoniyati mavjud. "
    "Foydalanuvchilarga savollariga qisqa, aniq va do'stona javob ber. "
    "Faqat o'zbek tilida javob ber. "
    "Agar savol platformaga aloqador bo'lmasa, iltimos boshqa manbalardan foydalanishni tavsiya qil.\n\n"

    "MUHIM QOIDALAR:\n"
    "1. Agar foydalanuvchi testda xatolik, noto'g'ri javob, bug yoki muammo haqida aytsa — "
    "DARHOL eskalatsiya qilMA. Avval quyidagilarni SO'RA:\n"
    "   - Qaysi fan (masalan: Matematika, Fizika)?\n"
    "   - Qaysi savol yoki savol raqami?\n"
    "   - Qanday xatolik (noto'g'ri javob, savol ko'rinmayapti, va hokazo)?\n"
    "Har bir savolni alohida-alohida emas, bitta xabarda so'ra.\n"
    "2. Foydalanuvchi barcha ma'lumotni berganidan keyin, xabaringni quyidagi formatda yoz:\n"
    "   Avval foydalanuvchiga: 'Rahmat! Ma'lumotlaringiz qabul qilindi. Adminlarimiz tez orada siz bilan aloqaga chiqishadi.'\n"
    "   Keyin xabar oxiriga AYNAN shu belgini qo'sh (foydalanuvchiga ko'rinmaydi): [ESCALATE]\n"
    "3. Agar foydalanuvchi taklif bersa yoki admin bilan gaplashmoqchi bo'lsa — xuddi shunday: avval nima taklif ekanini so'ra, "
    "keyin ma'lumot to'plangach [ESCALATE] bilan javob ber.\n"
    "4. [ESCALATE] belgisini FAQAT to'liq ma'lumot to'plangandan keyin qo'y, oldinroq emas.\n"
    "5. Oddiy savollar (platforma qanday ishlaydi, narxlar, va hokazo) uchun [ESCALATE] QILMA, o'zing javob ber."
)


class ChatSendRequest(BaseModel):
    message: str
    session_key: str


class AdminReplyRequest(BaseModel):
    text: str


def _send_telegram_notification(session_id: int, summary: str):
    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = settings.ADMIN_CHAT_ID
    if not token or not chat_id:
        return
    text = (
        f"💬 <b>Yangi murojaat (Chat #{session_id})</b>\n\n"
        f"{summary[:800]}\n\n"
        f"🔗 Admin paneldan javob bering"
    )
    try:
        http_requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception:
        pass


def _build_chat_history(session_id: int, db: Session) -> list[dict]:
    msgs = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in msgs:
        if m.role == "user":
            history.append({"role": "user", "content": m.text})
        elif m.role in ("bot", "admin"):
            history.append({"role": "assistant", "content": m.text})
    return history


def _get_ai_reply(chat_history: list[dict]) -> str:
    settings = get_settings()
    try:
        if settings.GROQ_API_KEY:
            resp = http_requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={"model": "llama-3.3-70b-versatile", "messages": chat_history, "temperature": 0.7, "max_tokens": 512},
                timeout=30,
            )
            data = resp.json()
            if resp.status_code == 200:
                return data["choices"][0]["message"]["content"].strip()
        elif settings.GEMINI_API_KEY:
            prompt_parts = []
            for m in chat_history:
                role = m["role"]
                if role == "system":
                    prompt_parts.append(f"Sistema: {m['content']}")
                elif role == "user":
                    prompt_parts.append(f"Foydalanuvchi: {m['content']}")
                else:
                    prompt_parts.append(f"Bot: {m['content']}")
            full_prompt = "\n\n".join(prompt_parts)

            resp = http_requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 512},
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code == 200:
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        pass
    return "Kechirasiz, hozirda javob bera olmayapman. Iltimos, keyinroq urinib ko'ring."


def _build_escalation_summary(session_id: int, db: Session) -> str:
    msgs = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "user",
    ).order_by(ChatMessage.created_at).all()

    lines = []
    for i, m in enumerate(msgs, 1):
        lines.append(f"{i}. {m.text}")
    return "\n".join(lines)


# ——— Public endpoints ———

@router.post("/send")
def chat_send(body: ChatSendRequest, db: Session = Depends(get_db)):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Xabar bo'sh")
    if len(body.message) > 1000:
        raise HTTPException(status_code=400, detail="Xabar juda uzun")

    session = db.query(ChatSession).filter(ChatSession.session_key == body.session_key).first()
    if not session:
        session = ChatSession(session_key=body.session_key)
        db.add(session)
        db.flush()

    user_msg = ChatMessage(session_id=session.id, role="user", text=body.message.strip())
    db.add(user_msg)
    db.flush()

    if session.is_escalated:
        reply_text = "Xabaringiz adminga yuborildi. Tez orada javob olasiz. ⏳"
        bot_msg = ChatMessage(session_id=session.id, role="bot", text=reply_text)
        db.add(bot_msg)
        db.commit()
        threading.Thread(
            target=_send_telegram_notification,
            args=(session.id, body.message.strip()),
            daemon=True,
        ).start()
        return {"reply": reply_text, "escalated": True}

    chat_history = _build_chat_history(session.id, db)
    chat_history.append({"role": "user", "content": body.message.strip()})

    reply_text = _get_ai_reply(chat_history)

    should_escalate = "[ESCALATE]" in reply_text
    clean_reply = reply_text.replace("[ESCALATE]", "").strip()

    bot_msg = ChatMessage(session_id=session.id, role="bot", text=clean_reply)
    db.add(bot_msg)

    if should_escalate:
        session.is_escalated = True
        db.commit()

        summary = _build_escalation_summary(session.id, db)
        threading.Thread(
            target=_send_telegram_notification,
            args=(session.id, summary),
            daemon=True,
        ).start()

        return {"reply": clean_reply, "escalated": True}

    db.commit()
    return {"reply": clean_reply, "escalated": False}


@router.get("/messages")
def get_chat_messages(session_key: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.session_key == session_key).first()
    if not session:
        return {"messages": []}

    msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()

    db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id,
        ChatMessage.role == "admin",
        ChatMessage.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {
        "messages": [
            {"id": m.id, "role": m.role, "text": m.text, "created_at": m.created_at.isoformat()}
            for m in msgs
        ]
    }


# ——— Admin endpoints ———

@router.get("/sessions")
def list_sessions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query("all"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    q = db.query(ChatSession)
    if status == "escalated":
        q = q.filter(ChatSession.is_escalated == True)
    elif status == "active":
        q = q.filter(ChatSession.status == "active")

    total = q.count()
    sessions = q.order_by(desc(ChatSession.updated_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for s in sessions:
        last_msg = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).order_by(desc(ChatMessage.created_at)).first()
        unread = db.query(func.count(ChatMessage.id)).filter(
            ChatMessage.session_id == s.id, ChatMessage.role == "user", ChatMessage.is_read == False
        ).scalar()
        msg_count = db.query(func.count(ChatMessage.id)).filter(ChatMessage.session_id == s.id).scalar()

        result.append({
            "id": s.id,
            "session_key": s.session_key,
            "status": s.status,
            "is_escalated": s.is_escalated,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
            "last_message": last_msg.text[:100] if last_msg else "",
            "last_role": last_msg.role if last_msg else "",
            "unread_count": unread,
            "message_count": msg_count,
        })

    return {"sessions": result, "total": total}


@router.get("/sessions/{session_id}")
def get_session_messages(session_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat topilmadi")

    msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()

    db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "user",
        ChatMessage.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {
        "session": {
            "id": session.id,
            "session_key": session.session_key,
            "status": session.status,
            "is_escalated": session.is_escalated,
            "created_at": session.created_at.isoformat(),
        },
        "messages": [
            {"id": m.id, "role": m.role, "text": m.text, "created_at": m.created_at.isoformat()}
            for m in msgs
        ],
    }


@router.post("/sessions/{session_id}/reply")
def admin_reply(session_id: int, body: AdminReplyRequest, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat topilmadi")

    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Xabar bo'sh")

    msg = ChatMessage(session_id=session.id, role="admin", text=body.text.strip())
    db.add(msg)
    db.commit()

    return {"ok": True}


@router.get("/unread-count")
def chat_unread_count(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    count = db.query(func.count(ChatSession.id)).filter(
        ChatSession.is_escalated == True,
        ChatSession.status == "active",
    ).scalar()
    return {"count": count or 0}
