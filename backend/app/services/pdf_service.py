import io
import logging
import math
import os
import random
import re
import traceback
import requests
from datetime import datetime, timezone
from fpdf import FPDF

from app.config import get_settings
from app.database import SessionLocal
from app.models.question import Question
from app.models.topic import Topic
from app.models.variant import TestVariant

logger = logging.getLogger(__name__)


def _strip_html(text: str) -> str:
    text = re.sub(r'<br\s*/?>', '\n', text)
    return re.sub(r'<[^>]+>', '', text).strip()


class TestPDF(FPDF):
    def __init__(self, subject_name: str, variant_id: int):
        super().__init__()
        self.subject_name = subject_name
        self.variant_id = variant_id

        font_dir = os.path.join(os.path.dirname(__file__), "fonts")
        font_path = os.path.join(font_dir, "DejaVuSans.ttf")
        bold_path = os.path.join(font_dir, "DejaVuSans-Bold.ttf")

        if os.path.exists(font_path):
            self.add_font("DJ", "", font_path, uni=True)
            self.add_font("DJ", "B", bold_path, uni=True)
        else:
            self.add_font("DJ", "", uni=True)
            self.add_font("DJ", "B", uni=True)

    def _watermark(self):
        self.set_font("DJ", "B", 54)
        self.set_text_color(220, 220, 220)
        cx = self.w / 2
        cy = self.h / 2
        with self.rotation(45, cx, cy):
            tw = self.get_string_width("TEST MARKET")
            self.set_xy(cx - tw / 2, cy - 10)
            self.cell(tw, 20, "TEST MARKET")
        self.set_text_color(0, 0, 0)

    def header(self):
        self._watermark()
        self.set_font("DJ", "B", 9)
        self.cell(0, 5, f"{self.subject_name}", align="L", new_x="LMARGIN")
        self.set_font("DJ", "", 8)
        self.cell(0, 5, f"Variant #{self.variant_id}", align="R", ln=True)
        self.set_draw_color(180, 180, 180)
        self.line(10, self.get_y(), self.w - 10, self.get_y())
        self.ln(2)
        self.set_text_color(0, 0, 0)

    def footer(self):
        self.set_y(-10)
        self.set_font("DJ", "", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 5, str(self.page_no()), align="C")
        self.set_text_color(0, 0, 0)

    def questions_two_col(self, questions):
        self.add_page()

        col_w = (self.w - 20 - 6) / 2
        col_x = [10, 10 + col_w + 6]
        col = 0
        y_start = self.get_y()
        max_y = self.h - 14
        self.set_y(y_start)

        for i, q in enumerate(questions, 1):
            q_text = _strip_html(q.question_text)
            options = []
            for letter, opt in [("A", q.option_a), ("B", q.option_b), ("C", q.option_c), ("D", q.option_d)]:
                options.append(f"{letter}) {_strip_html(opt) or '-'}")

            needed = self._estimate_height(i, q_text, options, col_w)

            if self.get_y() + needed > max_y:
                if col == 0:
                    col = 1
                    self.set_y(y_start)
                else:
                    self.add_page()
                    y_start = self.get_y()
                    col = 0

            self._draw_question(i, q_text, options, col_x[col], col_w)

        mid_x = 10 + col_w + 3
        for p in range(1, self.pages_count + 1):
            self.page = p
            self.set_draw_color(200, 200, 200)
            self.line(mid_x, 8, mid_x, self.h - 10)
        self.page = self.pages_count

    def _estimate_height(self, num, q_text, options, col_w):
        h = 0
        self.set_font("DJ", "B", 8.5)
        text_w = col_w - 2
        lines = self._count_lines(f"{num}. " + q_text, text_w)
        h += lines * 4.2 + 1.5

        self.set_font("DJ", "", 8)
        for opt in options:
            opt_lines = self._count_lines("  " + opt, text_w)
            h += opt_lines * 3.8
        h += 4
        return h

    def _count_lines(self, text, width):
        lines = 0
        for segment in text.split('\n'):
            sw = self.get_string_width(segment)
            segment_lines = max(1, math.ceil(sw / width)) if sw > 0 else 1
            lines += segment_lines
        return max(lines, 1)

    def _draw_question(self, num, q_text, options, x, col_w):
        self.set_x(x)
        self.set_font("DJ", "B", 8.5)
        self.multi_cell(col_w, 4.2, f"{num}. {q_text}")
        self.ln(0.5)

        self.set_font("DJ", "", 8)
        for opt in options:
            self.set_x(x + 3)
            self.multi_cell(col_w - 3, 3.8, opt)

        self.ln(3)


def generate_and_send(variant_id: int, telegram_id: int, subject_name: str, subject_id: int, question_count: int):
    db = SessionLocal()
    try:
        variant = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
        if not variant:
            logger.error(f"Variant #{variant_id} topilmadi")
            return

        logger.info(f"Variant #{variant_id}: PDF generatsiya boshlanmoqda ({subject_name}, {question_count} ta)")

        pdf_bytes, error = _generate_pdf(db, subject_name, subject_id, question_count, variant_id)
        if not pdf_bytes:
            err = error or "Savollar topilmadi"
            logger.error(f"Variant #{variant_id}: {err}")
            variant.status = "failed"
            variant.error_log = err
            db.commit()
            return

        logger.info(f"Variant #{variant_id}: PDF tayyor ({len(pdf_bytes)} bytes), Telegramga yuborilmoqda...")

        success, err_msg = _send_to_telegram(telegram_id, pdf_bytes, subject_name, question_count, variant_id)
        variant.status = "sent" if success else "failed"
        if success:
            variant.sent_at = datetime.now(timezone.utc)
            variant.error_log = None
            logger.info(f"Variant #{variant_id}: Muvaffaqiyatli yuborildi (telegram_id={telegram_id})")
        else:
            variant.error_log = err_msg
            logger.error(f"Variant #{variant_id}: Yuborishda xato — {err_msg}")
        db.commit()

    except Exception as e:
        err = traceback.format_exc()
        logger.error(f"Variant #{variant_id}: Kutilmagan xato — {err}")
        try:
            variant = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
            if variant:
                variant.status = "failed"
                variant.error_log = str(e)[:500]
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _generate_pdf(db, subject_name: str, subject_id: int, question_count: int, variant_id: int) -> tuple[bytes | None, str | None]:
    try:
        questions = (
            db.query(Question)
            .join(Topic)
            .filter(Topic.subject_id == subject_id, Topic.is_active == True)
            .all()
        )
        if not questions:
            return None, "Bu fanda savollar topilmadi"

        count = min(question_count, len(questions))
        selected = random.sample(questions, count)

        pdf = TestPDF(subject_name, variant_id)
        pdf.set_auto_page_break(auto=False)
        pdf.questions_two_col(selected)

        return pdf.output(), None
    except Exception as e:
        return None, f"PDF generatsiya xatosi: {str(e)}"


def _send_to_telegram(telegram_id: int, pdf_bytes: bytes, subject_name: str, question_count: int, variant_id: int) -> tuple[bool, str | None]:
    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        return False, "TELEGRAM_BOT_TOKEN sozlanmagan"

    url = f"https://api.telegram.org/bot{token}/sendDocument"
    caption = (
        f"✅ To'lovingiz tasdiqlandi!\n\n"
        f"📚 {subject_name}\n"
        f"❓ {question_count} ta savol\n"
        f"🆔 Variant: #{variant_id}\n\n"
        f"Omad tilaymiz!"
    )

    files = {"document": (f"{subject_name}_v{variant_id}.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"chat_id": telegram_id, "caption": caption}

    try:
        resp = requests.post(url, data=data, files=files, timeout=30)
        if resp.status_code == 200:
            return True, None
        return False, f"Telegram API xato: {resp.status_code} — {resp.text[:300]}"
    except Exception as e:
        return False, f"Request xato: {str(e)}"
