import io
import logging
import math
import os
import random
import re
import sys
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
    MARGIN = 10
    FONT_SIZE = 12
    LINE_H = 4.5
    GAP = 6

    def __init__(self, subject_name: str, variant_id: int):
        super().__init__()
        self.subject_name = subject_name
        self.variant_id = variant_id
        self.set_margins(self.MARGIN, self.MARGIN, self.MARGIN)

        font_dir = os.path.join(os.path.dirname(__file__), "fonts")

        tnr = os.path.join(font_dir, "TimesNewRoman.ttf")
        tnr_b = os.path.join(font_dir, "TimesNewRoman-Bold.ttf")
        sans = os.path.join(font_dir, "DejaVuSans.ttf")
        sans_b = os.path.join(font_dir, "DejaVuSans-Bold.ttf")

        if os.path.exists(tnr):
            self.add_font("TNR", "", tnr, uni=True)
            self.add_font("TNR", "B", tnr_b, uni=True)
        if os.path.exists(sans):
            self.add_font("Sans", "", sans, uni=True)
            self.add_font("Sans", "B", sans_b, uni=True)

        self.fn = "TNR" if os.path.exists(tnr) else "Sans"
        self.fn_wm = "Sans" if os.path.exists(sans) else self.fn

    _wm_img_cache = None

    @classmethod
    def _get_wm_image(cls):
        if cls._wm_img_cache is not None:
            return cls._wm_img_cache
        from PIL import Image, ImageDraw, ImageFont

        size = 800
        img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)

        try:
            font_path = os.path.join(os.path.dirname(__file__), "fonts", "DejaVuSans-Bold.ttf")
            if not os.path.exists(font_path):
                font_path = os.path.join(os.path.dirname(__file__), "fonts", "TimesNewRoman-Bold.ttf")
            font = ImageFont.truetype(font_path, 340)
        except Exception:
            font = ImageFont.load_default()

        text = "TM"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx = (size - tw) // 2
        ty = (size - th) // 2 - bbox[1]

        cx, cy = size // 2, size // 2
        r = max(tw, th) // 2 + 60
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(59, 130, 246, 30))

        draw.text((tx, ty), text, font=font, fill=(59, 130, 246, 90))

        cls._wm_img_cache = img
        return img

    def _watermark(self):
        save_x, save_y = self.get_x(), self.get_y()

        wm_img = self._get_wm_image()
        img_size = self.w - 40
        cx = (self.w - img_size) / 2
        cy = (self.h - img_size) / 2
        self.image(wm_img, x=cx, y=cy, w=img_size, h=img_size)

        save_font_family = self.font_family
        save_font_size = self.font_size_pt
        save_font_style = 'B' if 'B' in self.font_style else ''

        self.set_font(self.fn_wm, "", 13)
        self.set_text_color(210, 210, 210)
        wm_text = "Test Market"
        tw = self.get_string_width(wm_text)
        step_x = tw + 30
        step_y = 50
        for row in range(-4, 10):
            for col in range(-4, 10):
                cx = col * step_x + (row % 2) * (step_x / 2)
                cy = row * step_y + 30
                with self.rotation(35, cx, cy):
                    self.set_xy(cx - tw / 2, cy - 5)
                    self.cell(tw, 10, wm_text)

        self.set_text_color(0, 0, 0)
        self.set_font(save_font_family or self.fn, save_font_style, save_font_size)
        self.set_xy(save_x, save_y)

    def header(self):
        self._watermark()
        m = self.MARGIN
        self.set_xy(m, m)
        self.set_font(self.fn, "B", 10)
        self.set_text_color(0, 0, 0)
        self.cell(0, 5, self.subject_name, align="L", new_x="LMARGIN")
        self.set_font(self.fn, "", 9)
        self.cell(0, 5, f"Variant #{self.variant_id}", align="R", ln=True)
        self.set_draw_color(160, 160, 160)
        y = self.get_y() + 1
        self.line(m, y, self.w - m, y)
        self.set_y(y + 3)

    def footer(self):
        self.set_y(-self.MARGIN + 5)
        self.set_font(self.fn, "", 8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 5, "https://test-market.uz", align="L")
        self.cell(0, 5, str(self.page_no()), align="R")
        self.set_text_color(0, 0, 0)

    def questions_two_col(self, questions):
        self.add_page()
        m = self.MARGIN
        content_w = self.w - 2 * m
        col_w = (content_w - self.GAP) / 2
        col_x = [m, m + col_w + self.GAP]
        col = 0
        y_start = self.get_y()
        max_y = self.h - m - 5

        for i, q in enumerate(questions, 1):
            q_text = _strip_html(q.question_text)
            options = []
            for letter, opt in [("A", q.option_a), ("B", q.option_b), ("C", q.option_c), ("D", q.option_d)]:
                options.append(f"{letter}) {_strip_html(opt) or '-'}")

            needed = self._estimate_height(q_text, options, col_w)

            if self.get_y() + needed > max_y:
                if col == 0:
                    col = 1
                    self.set_y(y_start)
                else:
                    self.add_page()
                    y_start = self.get_y()
                    col = 0

            self._draw_question(i, q_text, options, col_x[col], col_w)

        mid_x = m + col_w + self.GAP / 2
        for p in range(1, self.pages_count + 1):
            self.page = p
            self.set_draw_color(190, 190, 190)
            self.line(mid_x, m, mid_x, self.h - m)
        self.page = self.pages_count

    def _estimate_height(self, q_text, options, col_w):
        h = 0
        self.set_font(self.fn, "", self.FONT_SIZE)
        lines = self._count_lines(q_text, col_w)
        h += lines * self.LINE_H + 1

        self.set_font(self.fn, "", self.FONT_SIZE)
        for opt in options:
            h += self._count_lines(opt, col_w - 5) * self.LINE_H
        h += 3
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
        self.set_font(self.fn, "", self.FONT_SIZE)
        self.multi_cell(col_w, self.LINE_H, f"{num}. {q_text}")
        self.ln(0.5)

        self.set_font(self.fn, "", self.FONT_SIZE)
        for opt in options:
            self.set_x(x + 5)
            self.multi_cell(col_w - 5, self.LINE_H, opt)

        self.ln(2.5)


def generate_and_send(variant_id: int, telegram_id: int, subject_name: str, subject_id: int, question_count: int):
    db = SessionLocal()
    try:
        variant = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
        if not variant:
            sys.stdout.write(f"Variant #{variant_id} topilmadi")
            return

        sys.stdout.write(f"Variant #{variant_id}: PDF generatsiya boshlanmoqda ({subject_name}, {question_count} ta)")

        pdf_bytes, error = _generate_pdf(db, subject_name, subject_id, question_count, variant_id)
        if not pdf_bytes:
            err = error or "Savollar topilmadi"
            sys.stdout.write(f"Variant #{variant_id}: {err}")
            variant.status = "failed"
            variant.error_log = err
            db.commit()
            return

        sys.stdout.write(f"Variant #{variant_id}: PDF tayyor ({len(pdf_bytes)} bytes), Telegramga yuborilmoqda...")

        success, err_msg = _send_to_telegram(telegram_id, pdf_bytes, subject_name, question_count, variant_id)
        variant.status = "sent" if success else "failed"
        if success:
            variant.sent_at = datetime.now(timezone.utc)
            variant.error_log = None
            sys.stdout.write(f"Variant #{variant_id}: Muvaffaqiyatli yuborildi (telegram_id={telegram_id})")
        else:
            variant.error_log = err_msg
            sys.stdout.write(f"Variant #{variant_id}: Yuborishda xato — {err_msg}")
        db.commit()

    except Exception as e:
        err = traceback.format_exc()
        sys.stdout.write(f"Variant #{variant_id}: Kutilmagan xato — {err}")
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
