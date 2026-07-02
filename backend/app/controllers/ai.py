from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_admin
from app.models.user import User
from app.config import get_settings
import requests

router = APIRouter(prefix="/ai", tags=["ai"])


class AiRequest(BaseModel):
    text: str
    action: str
    context: str = ""
    image: str | None = None


PROMPTS = {
    "continue": "Sen test savoli muharriri yordamchisisan. Quyidagi tugallanmagan test savoli matnini davom ettir. TESTNI YECHMA. Javob berma. Faqat matnning davomini yoz:\n\n{text}",
    "rewrite": "Sen test savoli muharriri yordamchisisan. Quyidagi test savolini qayta yoz. TESTNI YECHMA, javob berma, yechimini ko'rsatma. Savol mazmunini saqla lekin sonlarni o'zgartirib boshqacharoq ifodalab ber. Faqat yangi savol matnini ber, boshqa hech narsa qo'shma:\n\n{text}",
    "simplify": "Sen test savoli muharriri yordamchisisan. Quyidagi test savolini soddaroq qilib yoz. TESTNI YECHMA, javob berma. Faqat soddalashtirilgan savol matnini ber:\n\n{text}",
    "generate_question": "Sen DTM test savoli yaratuvchisisan. Quyidagi fan va mavzu bo'yicha 1 ta yangi test savoli yarat. Faqat SAVOL matnini va 4 ta variantni ber. TESTNI YECHMA, yechimini ko'rsatma, tushuntirma berma.\n\nFan va mavzu: {context}\n\nFormat:\nSavol: ...\nA) ...\nB) ...\nC) ...\nD) ...\nTo'g'ri javob: A/B/C/D",
    "generate_options": "Sen test savoli muharriri yordamchisisan. Quyidagi test savoli uchun 4 ta javob varianti yarat. Bittasi to'g'ri, qolganlari noto'g'ri lekin ishonchli bo'lsin. TESTNI YECHMA, yechim jarayonini ko'rsatma. Faqat variantlarni ber:\n\nSavol: {text}\n\nFormat:\nA) ...\nB) ...\nC) ...\nD) ...\nTo'g'ri javob: A/B/C/D",
    "improve": "Sen test savoli muharriri yordamchisisan. Quyidagi test savolini yaxshilab ber — aniqroq, tushunarli va DTM standartiga mos qil. TESTNI YECHMA, javob berma, yechimini ko'rsatma. Faqat yaxshilangan savol matnini ber:\n\n{text}",
    "announcement_improve": "Sen Telegram bot va kanal uchun e'lon matnlari yozuvchi muharrirsan. Quyidagi e'lon/xabar matnini yaxshilab ber — imlosini tuzat, aniqroq va o'quvchiga yoqimli, professional ohangda qil. Matn mazmunini saqla. Faqat yaxshilangan matnni ber, boshqa hech narsa qo'shma:\n\n{text}",
    "announcement_generate": (
        "Sen Test Market platformasining Telegram bot va kanali uchun e'lon yozuvchisisan. "
        "Test Market — DTM va attestatsiyaga tayyorlanishga yordam beruvchi test platformasi, "
        "unda turli fanlar bo'yicha testlar mavjud va foydalanuvchilar Telegram bot orqali test ishlaydi.\n\n"
        "Quyida admin bergan ko'rsatma asosida, FAQAT o'sha ko'rsatmada so'ralgan mavzuda, qisqa va chiroyli "
        "Telegram e'loni yoz. Ko'rsatmada aytilmagan boshqa mavzularga chalg'ima, platformani umumiy tanishtirib "
        "o'tirma va ortiqcha kirish so'zlar yozma — to'g'ridan-to'g'ri tayyor e'lon matnini ber. "
        "O'rinli bo'lsa bir nechta emoji ishlatishing mumkin, ko'p bo'lmasin:\n\n"
        "Ko'rsatma: {context}"
    ),
    "latex": (
        "Quyidagi matnda oddiy yozilgan matematik ifodalar, formulalar, sonlar, "
        "amallar va belgilarni topib, ularni LaTeX formatiga o'girib bering. "
        'Har bir formulani <span data-latex="LATEX_KOD"></span> tegiga o\'rab bering. '
        "Oddiy matnni o'zgartirmang.\n\n"
        "Misol:\n"
        'Kirish: "x^2 + 3x - 5 = 0 tenglamani yeching"\n'
        'Chiqish: <span data-latex="x^2 + 3x - 5 = 0"></span> tenglamani yeching\n\n'
        "Misol:\n"
        'Kirish: "f(x) = 2x^2 + 3x ni x=2 da hisoblang"\n'
        'Chiqish: <span data-latex="f(x) = 2x^2 + 3x"></span> ni <span data-latex="x=2"></span> da hisoblang\n\n'
        "Faqat natijani bering, boshqa hech narsa qo'shmang:\n\n{text}"
    ),
}


def _parse_image_base64(image_data: str) -> tuple[str, str]:
    if image_data.startswith("data:"):
        header, b64 = image_data.split(",", 1)
        mime = header.split(":")[1].split(";")[0]
        return mime, b64
    return "image/jpeg", image_data


def _call_groq(api_key: str, prompt: str, image: str | None = None) -> str:
    content: list[dict] = []
    if image:
        mime, b64 = _parse_image_base64(image)
        content.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}})
    content.append({"type": "text", "text": prompt})

    model = "meta-llama/llama-4-scout-17b-16e-instruct" if image else "llama-3.3-70b-versatile"

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": content}],
            "temperature": 0.7,
            "max_tokens": 2048,
        },
        timeout=60,
    )
    data = resp.json()
    if resp.status_code != 200:
        detail = data.get("error", {}).get("message", "Groq API xatosi")
        raise HTTPException(status_code=502, detail=detail)
    return data["choices"][0]["message"]["content"].strip()


def _call_gemini(api_key: str, prompt: str, image: str | None = None) -> str:
    parts: list[dict] = []
    if image:
        mime, b64 = _parse_image_base64(image)
        parts.append({"inline_data": {"mime_type": mime, "data": b64}})
    parts.append({"text": prompt})

    resp = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
        json={
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048},
        },
        timeout=60,
    )
    data = resp.json()
    if resp.status_code != 200:
        detail = data.get("error", {}).get("message", "Gemini API xatosi")
        raise HTTPException(status_code=502, detail=detail)
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


@router.post("/assist")
def ai_assist(body: AiRequest, admin: User = Depends(get_current_admin)):
    settings = get_settings()

    if body.action == "custom_prompt":
        prompt = body.text
    else:
        prompt_template = PROMPTS.get(body.action)
        if not prompt_template:
            raise HTTPException(status_code=400, detail=f"Noma'lum amal: {body.action}")
        prompt = prompt_template.format(text=body.text, context=body.context)

    image = body.image if body.action == "custom_prompt" else None

    try:
        if settings.GROQ_API_KEY:
            result = _call_groq(settings.GROQ_API_KEY, prompt, image)
        elif settings.GEMINI_API_KEY:
            result = _call_gemini(settings.GEMINI_API_KEY, prompt, image)
        else:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY yoki GEMINI_API_KEY sozlanmagan")

        return {"result": result}

    except requests.Timeout:
        raise HTTPException(status_code=504, detail="AI javob bermadi (timeout)")
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="AI javobini o'qib bo'lmadi")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
