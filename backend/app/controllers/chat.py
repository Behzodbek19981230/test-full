from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_settings
import requests

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = (
    "Sen Test Market platformasining yordamchi botisan. "
    "Test Market — DTM va attestatsiyaga tayyorlanish platformasi. "
    "Platformada barcha fanlar bo'yicha testlar, majburiy fanlar bloki, "
    "Telegram bot orqali test ishlash imkoniyati mavjud. "
    "Foydalanuvchilarga savollariga qisqa, aniq va do'stona javob ber. "
    "Faqat o'zbek tilida javob ber. "
    "Agar savol platformaga aloqador bo'lmasa, iltimos boshqa manbalardan foydalanishni tavsiya qil."
)


class ChatMessage(BaseModel):
    message: str


@router.post("/send")
def chat_send(body: ChatMessage):
    settings = get_settings()

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Xabar bo'sh")

    if len(body.message) > 1000:
        raise HTTPException(status_code=400, detail="Xabar juda uzun")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": body.message.strip()},
    ]

    try:
        if settings.GROQ_API_KEY:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 512,
                },
                timeout=30,
            )
        elif settings.GEMINI_API_KEY:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nFoydalanuvchi: {body.message.strip()}"}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 512},
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="AI javob bermadi")
            return {"reply": data["candidates"][0]["content"]["parts"][0]["text"].strip()}
        else:
            raise HTTPException(status_code=500, detail="AI sozlanmagan")

        data = resp.json()
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="AI javob bermadi")
        return {"reply": data["choices"][0]["message"]["content"].strip()}

    except requests.Timeout:
        raise HTTPException(status_code=504, detail="AI javob bermadi")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Xatolik yuz berdi")
