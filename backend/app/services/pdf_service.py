import io
import os
import random
import re
import requests
from fpdf import FPDF

from app.config import get_settings
from app.database import SessionLocal
from app.models.question import Question
from app.models.topic import Topic


def _strip_html(text: str) -> str:
    return re.sub(r'<[^>]+>', '', text).strip()


def generate_test_pdf(subject_name: str, subject_id: int, question_count: int, mode: str) -> bytes | None:
    db = SessionLocal()
    try:
        questions = (
            db.query(Question)
            .join(Topic)
            .filter(Topic.subject_id == subject_id, Topic.is_active == True)
            .all()
        )
        if not questions:
            return None

        count = min(question_count, len(questions))
        selected = random.sample(questions, count)

        pdf = FPDF()
        pdf.add_page()

        font_path = os.path.join(os.path.dirname(__file__), "fonts", "DejaVuSans.ttf")
        if os.path.exists(font_path):
            pdf.add_font("DejaVu", "", font_path, uni=True)
            pdf.add_font("DejaVu", "B", os.path.join(os.path.dirname(__file__), "fonts", "DejaVuSans-Bold.ttf"), uni=True)
            font_name = "DejaVu"
        else:
            pdf.add_font("DejaVu", "", uni=True)
            font_name = "DejaVu"

        pdf.set_font(font_name, "B", 16)
        pdf.cell(0, 12, subject_name, ln=True, align="C")
        pdf.set_font(font_name, "", 10)
        pdf.cell(0, 8, f"Savollar soni: {count}", ln=True, align="C")
        pdf.ln(8)

        for i, q in enumerate(selected, 1):
            pdf.set_font(font_name, "B", 11)
            q_text = _strip_html(q.question_text)
            pdf.multi_cell(0, 7, f"{i}. {q_text}")

            pdf.set_font(font_name, "", 10)
            for letter, option in [("A", q.option_a), ("B", q.option_b), ("C", q.option_c), ("D", q.option_d)]:
                opt_text = _strip_html(option)
                pdf.multi_cell(0, 6, f"   {letter}) {opt_text}")
            pdf.ln(4)

        pdf.ln(6)
        pdf.set_font(font_name, "B", 12)
        pdf.cell(0, 10, "Javoblar", ln=True, align="C")
        pdf.set_font(font_name, "", 10)

        answers_line = ""
        for i, q in enumerate(selected, 1):
            answers_line += f"{i}-{q.correct_option}   "
            if i % 10 == 0:
                pdf.cell(0, 6, answers_line.strip(), ln=True, align="C")
                answers_line = ""
        if answers_line.strip():
            pdf.cell(0, 6, answers_line.strip(), ln=True, align="C")

        return pdf.output()
    finally:
        db.close()


def send_pdf_to_telegram(telegram_id: int, pdf_bytes: bytes, subject_name: str, question_count: int):
    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        return

    url = f"https://api.telegram.org/bot{token}/sendDocument"

    caption = (
        f"✅ To'lovingiz tasdiqlandi!\n\n"
        f"📚 Fan: {subject_name}\n"
        f"❓ Savollar: {question_count} ta\n\n"
        f"Omad tilaymiz! 🍀"
    )

    files = {"document": (f"{subject_name}.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"chat_id": telegram_id, "caption": caption, "parse_mode": "Markdown"}

    try:
        requests.post(url, data=data, files=files, timeout=30)
    except Exception:
        pass
