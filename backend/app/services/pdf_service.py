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


_SUPERSCRIPTS = str.maketrans('0123456789+-=()nabicdex', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇⁱᶜᵈᵉˣ')
_SUBSCRIPTS = str.maketrans('0123456789+-=()aeiourbjklmnpstx', '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑᵢₒᵤᵣᵦⱼₖₗₘₙₚₛₜₓ')

_GREEK = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
    '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
    '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ',
    '\\upsilon': 'υ', '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ',
    '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
    '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ',
    '\\Psi': 'Ψ', '\\Omega': 'Ω',
}

_SYMBOLS = {
    '\\infty': '∞', '\\pm': '±', '\\mp': '∓', '\\times': '×',
    '\\div': '÷', '\\cdot': '·', '\\neq': '≠', '\\approx': '≈',
    '\\leq': '≤', '\\geq': '≥', '\\ll': '≪', '\\gg': '≫',
    '\\equiv': '≡', '\\sim': '∼', '\\propto': '∝',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅',
    '\\forall': '∀', '\\exists': '∃', '\\neg': '¬',
    '\\land': '∧', '\\lor': '∨',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    '\\to': '→', '\\uparrow': '↑', '\\downarrow': '↓',
    '\\partial': '∂', '\\nabla': '∇', '\\hbar': 'ℏ',
    '\\angle': '∠', '\\triangle': '△', '\\perp': '⊥', '\\parallel': '∥',
    '\\circ': '°', '\\bullet': '•', '\\star': '★',
    '\\rightleftharpoons': '⇌',
    '\\ell': 'ℓ', '\\Re': 'ℜ', '\\Im': 'ℑ',
    '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮',
}


def _match_brace(s: str, start: int) -> int:
    if start >= len(s) or s[start] != '{':
        return start
    depth = 0
    for i in range(start, len(s)):
        if s[i] == '{':
            depth += 1
        elif s[i] == '}':
            depth -= 1
            if depth == 0:
                return i
    return len(s) - 1


def _extract_brace_arg(s: str, pos: int) -> tuple[str, int]:
    if pos >= len(s) or s[pos] != '{':
        return '', pos
    end = _match_brace(s, pos)
    return s[pos + 1:end], end + 1


def _replace_cmd_with_braces(s: str, cmd: str, fmt_fn) -> str:
    result = []
    i = 0
    cmd_len = len(cmd)
    while i < len(s):
        if s[i:i + cmd_len] == cmd and (i + cmd_len >= len(s) or not s[i + cmd_len].isalpha()):
            pos = i + cmd_len
            args = []
            while pos < len(s) and s[pos] == '{':
                arg, pos = _extract_brace_arg(s, pos)
                args.append(arg)
                if len(args) >= 3:
                    break
            result.append(fmt_fn(*args))
            i = pos
        else:
            result.append(s[i])
            i += 1
    return ''.join(result)


def _latex_to_unicode(latex: str) -> str:
    s = latex.strip()

    combined = {**_GREEK, **_SYMBOLS}
    sorted_cmds = sorted(combined.keys(), key=len, reverse=True)
    for cmd in sorted_cmds:
        pattern = re.escape(cmd) + r'(?![a-zA-Z])'
        s = re.sub(pattern, combined[cmd], s)

    s = re.sub(r'\\text\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\textbf\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\mathrm\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\mathbb\{([^}]*)\}', r'\1', s)

    s = re.sub(r'\\(?:sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan)', lambda m: m.group(0)[1:], s)
    s = re.sub(r'\\(?:log|ln|exp|lim|max|min|det|dim|gcd|deg)', lambda m: m.group(0)[1:], s)

    s = re.sub(r'\\vec\{([^}]*)\}', r'\1⃗', s)
    s = re.sub(r'\\overrightarrow\{([^}]*)\}', r'\1⃗', s)
    s = re.sub(r'\\overline\{([^}]*)\}', r'\1', s)
    s = re.sub(r'\\hat\{([^}]*)\}', r'\1̂', s)
    s = re.sub(r'\\bar\{([^}]*)\}', r'\1̄', s)
    s = re.sub(r'\\dot\{([^}]*)\}', r'\1̇', s)

    s = re.sub(r'\\xrightarrow\{([^}]*)\}', lambda m: f'-[{_latex_to_unicode(m.group(1))}]→', s)
    s = re.sub(r'\\binom\{([^}]*)\}\{([^}]*)\}', r'C(\1,\2)', s)

    s = re.sub(r'\\begin\{cases\}(.*?)\\end\{cases\}', lambda m: m.group(1).replace('\\\\', '; '), s)
    s = re.sub(r'\\begin\{[^}]*\}(.*?)\\end\{[^}]*\}', lambda m: m.group(1).replace('\\\\', ', ').replace('&', ' '), s)

    s = _replace_cmd_with_braces(s, '\\frac', lambda a, b='', *_: f'({_latex_to_unicode(a)}/{_latex_to_unicode(b)})')
    s = _replace_cmd_with_braces(s, '\\sqrt', lambda a, *_: f'√({_latex_to_unicode(a)})')

    s = re.sub(r'\\iint', '∬', s)
    s = re.sub(r'\\oint', '∮', s)
    s = re.sub(r'\\sum', '∑', s)
    s = re.sub(r'\\prod', '∏', s)
    s = re.sub(r'\\int', '∫', s)

    def _sup(m):
        return m.group(1).translate(_SUPERSCRIPTS)

    def _sub(m):
        return m.group(1).translate(_SUBSCRIPTS)

    s = re.sub(r'\^{([^}]*)}', _sup, s)
    s = re.sub(r'\^([a-zA-Z0-9])', lambda m: m.group(1).translate(_SUPERSCRIPTS), s)
    s = re.sub(r'_{([^}]*)}', _sub, s)
    s = re.sub(r'_([a-zA-Z0-9])', lambda m: m.group(1).translate(_SUBSCRIPTS), s)

    s = s.replace('\\,', ' ').replace('\\;', ' ').replace('\\!', '')
    s = s.replace('\\left', '').replace('\\right', '')
    s = s.replace('\\{', '{').replace('\\}', '}')
    s = re.sub(r'\\[a-zA-Z]+', '', s)
    s = s.replace('{', '').replace('}', '')
    s = re.sub(r'\s+', ' ', s).strip()

    return s


def _strip_html(text: str) -> str:
    text = re.sub(
        r'<span[^>]*data-latex="([^"]*)"[^>]*>.*?</span>',
        lambda m: _latex_to_unicode(m.group(1)),
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r'<span[^>]*latex="([^"]*)"[^>]*>.*?</span>',
        lambda m: _latex_to_unicode(m.group(1)),
        text,
        flags=re.DOTALL,
    )

    text = re.sub(r'<img[^>]*>', '', text)

    text = re.sub(r'</li>\s*<li', '</li>\n<li', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</p>\s*<p', '\n<p', text)

    return re.sub(r'<[^>]+>', '', text).strip()


def _parse_html_blocks(html: str) -> list:
    """Parse HTML into list of ('text', str) and ('image', bytes) blocks."""
    html = re.sub(
        r'<span[^>]*data-latex="([^"]*)"[^>]*>.*?</span>',
        lambda m: _latex_to_unicode(m.group(1)),
        html, flags=re.DOTALL,
    )
    html = re.sub(
        r'<span[^>]*latex="([^"]*)"[^>]*>.*?</span>',
        lambda m: _latex_to_unicode(m.group(1)),
        html, flags=re.DOTALL,
    )

    blocks = []
    img_pattern = re.compile(r'<img[^>]*src="([^"]*)"[^>]*/?>',  re.DOTALL)
    last_end = 0

    for m in img_pattern.finditer(html):
        before = html[last_end:m.start()]
        if before.strip():
            blocks.append(('text', _clean_tags(before)))

        src = m.group(1)
        img_bytes = _resolve_image(src)
        if img_bytes:
            blocks.append(('image', img_bytes))
        last_end = m.end()

    remaining = html[last_end:]
    if remaining.strip():
        blocks.append(('text', _clean_tags(remaining)))

    if not blocks:
        blocks.append(('text', _clean_tags(html)))

    return blocks


def _clean_tags(text: str) -> str:
    text = re.sub(r'</li>\s*<li', '</li>\n<li', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</p>\s*<p', '\n<p', text)
    return re.sub(r'<[^>]+>', '', text).strip()


def _resolve_image(src: str) -> bytes | None:
    import base64
    if src.startswith('data:image'):
        try:
            _, data = src.split(',', 1)
            return base64.b64decode(data)
        except Exception:
            return None
    if src.startswith(('http://', 'https://', '/')):
        try:
            url = src
            if src.startswith('/'):
                url = get_settings().FRONTEND_URL.rstrip('/') + src
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                return resp.content
        except Exception:
            pass
    return None


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
        self.fn_q = "Sans" if os.path.exists(sans) else self.fn
        self.fn_wm = "Sans" if os.path.exists(sans) else self.fn

    _wm_img_cache = None

    @classmethod
    def _get_wm_image(cls):
        if cls._wm_img_cache is not None:
            return cls._wm_img_cache
        from PIL import Image, ImageDraw

        size = 800
        img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)

        cx, cy = size // 2, size // 2
        r = 320
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(59, 130, 246, 25))

        color = (59, 130, 246, 80)
        w = 8

        s = 380
        ox, oy = (size - s) // 2, (size - s) // 2

        def p(x, y):
            return (ox + x * s / 24, oy + y * s / 24)

        # graduation cap top: M22,9 L12,5 L2,9 L12,13 L22,9
        cap = [p(22, 9), p(12, 5), p(2, 9), p(12, 13), p(22, 9)]
        draw.line(cap, fill=color, width=w, joint="curve")
        # right pole: V6 from (22,9) to (22,15)
        draw.line([p(22, 9), p(22, 15)], fill=color, width=w)
        # building arc: M6,10.6 V16 ... M18,10.6 V16
        draw.line([p(6, 10.6), p(6, 16)], fill=color, width=w)
        draw.line([p(18, 10.6), p(18, 16)], fill=color, width=w)
        # bottom arc approximation
        arc_pts = []
        for i in range(21):
            t = i / 20.0
            x = 6 + t * 12
            y = 16 + 3 * math.sin(t * math.pi)
            arc_pts.append(p(x, y))
        draw.line(arc_pts, fill=color, width=w, joint="curve")

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
            q_blocks = _parse_html_blocks(q.question_text)
            opt_blocks = []
            for letter, opt in [("A", q.option_a), ("B", q.option_b), ("C", q.option_c), ("D", q.option_d)]:
                opt_blocks.append((letter, _parse_html_blocks(opt)))

            needed = self._estimate_height_blocks(q_blocks, opt_blocks, col_w)

            if self.get_y() + needed > max_y:
                if col == 0:
                    col = 1
                    self.set_y(y_start)
                else:
                    self.add_page()
                    y_start = self.get_y()
                    col = 0

            self._draw_question_blocks(i, q_blocks, opt_blocks, col_x[col], col_w)

        mid_x = m + col_w + self.GAP / 2
        for p in range(1, self.pages_count + 1):
            self.page = p
            self.set_draw_color(190, 190, 190)
            self.line(mid_x, m, mid_x, self.h - m)
        self.page = self.pages_count

    def _estimate_height_blocks(self, q_blocks, opt_blocks, col_w):
        h = 0
        self.set_font(self.fn_q, "", self.FONT_SIZE)
        for btype, bdata in q_blocks:
            if btype == 'text':
                h += self._count_lines(bdata, col_w) * self.LINE_H
            else:
                h += self._img_height(bdata, col_w) + 2
        h += 1

        self.set_font(self.fn_q, "", self.FONT_SIZE)
        for letter, blocks in opt_blocks:
            for btype, bdata in blocks:
                if btype == 'text':
                    h += self._count_lines(f"{letter}) {bdata}", col_w - 5) * self.LINE_H
                else:
                    h += self._img_height(bdata, col_w - 5) + 2
        h += 3
        return h

    def _img_height(self, img_bytes, max_w):
        from PIL import Image as PILImage
        try:
            img = PILImage.open(io.BytesIO(img_bytes))
            w, h = img.size
            scale = min(max_w / (w * 0.264583), 1.0)
            return h * 0.264583 * scale
        except Exception:
            return 15

    def _count_lines(self, text, width):
        lines = 0
        for segment in text.split('\n'):
            sw = self.get_string_width(segment)
            segment_lines = max(1, math.ceil(sw / width)) if sw > 0 else 1
            lines += segment_lines
        return max(lines, 1)

    def _draw_question_blocks(self, num, q_blocks, opt_blocks, x, col_w):
        self.set_font(self.fn_q, "", self.FONT_SIZE)
        first = True
        for btype, bdata in q_blocks:
            if btype == 'text':
                self.set_x(x)
                prefix = f"{num}. " if first else ""
                self.multi_cell(col_w, self.LINE_H, f"{prefix}{bdata}")
            else:
                self._draw_image_block(bdata, x, col_w)
            first = False
        self.ln(0.5)

        self.set_font(self.fn_q, "", self.FONT_SIZE)
        for letter, blocks in opt_blocks:
            first_opt = True
            for btype, bdata in blocks:
                if btype == 'text':
                    self.set_x(x + 5)
                    prefix = f"{letter}) " if first_opt else ""
                    self.multi_cell(col_w - 5, self.LINE_H, f"{prefix}{bdata}")
                else:
                    self._draw_image_block(bdata, x + 5, col_w - 5)
                first_opt = False

        self.ln(2.5)

    def _draw_image_block(self, img_bytes, x, max_w):
        from PIL import Image as PILImage
        try:
            pil_img = PILImage.open(io.BytesIO(img_bytes))
            w_px, h_px = pil_img.size
            w_mm = w_px * 0.264583
            h_mm = h_px * 0.264583
            if w_mm > max_w:
                scale = max_w / w_mm
                w_mm = max_w
                h_mm *= scale
            max_h = 40
            if h_mm > max_h:
                scale = max_h / h_mm
                h_mm = max_h
                w_mm *= scale
            self.set_x(x)
            self.image(pil_img, x=x, y=self.get_y(), w=w_mm, h=h_mm)
            self.set_y(self.get_y() + h_mm + 1)
        except Exception:
            self.set_x(x)
            self.multi_cell(max_w, self.LINE_H, "[rasm]")


def generate_and_send(variant_id: int, telegram_id: int, subject_name: str, subject_id: int, question_count: int):
    db = SessionLocal()
    try:
        variant = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
        if not variant:
            sys.stdout.write(f"Variant #{variant_id} topilmadi")
            return

        sys.stdout.write(f"Variant #{variant_id}: Savollar tanlanmoqda ({subject_name}, {question_count} ta)")

        questions = (
            db.query(Question)
            .join(Topic)
            .filter(Topic.subject_id == subject_id, Topic.is_active == True)
            .all()
        )
        if not questions:
            variant.status = "failed"
            variant.error_log = "Bu fanda savollar topilmadi"
            db.commit()
            return

        count = min(question_count, len(questions))
        selected = random.sample(questions, count)
        variant.question_ids = ",".join(str(q.id) for q in selected)
        db.commit()

        sys.stdout.write(f"Variant #{variant_id}: {count} ta savol tanlandi, HTML generatsiya qilinmoqda...")

        html_path = _generate_html(selected, subject_name, variant_id)

        sys.stdout.write(f"Variant #{variant_id}: HTML tayyor, link yuborilmoqda...")

        success, err_msg = _send_link_to_telegram(telegram_id, subject_name, question_count, variant_id, html_path)
        variant.status = "sent" if success else "failed"
        if success:
            variant.sent_at = datetime.now(timezone.utc)
            variant.error_log = None
            sys.stdout.write(f"Variant #{variant_id}: Link muvaffaqiyatli yuborildi (telegram_id={telegram_id})")
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


def _generate_html(questions, subject_name: str, variant_id: int) -> str:
    settings = get_settings()
    upload_dir = settings.UPLOAD_DIR
    variants_dir = os.path.join(upload_dir, "variants")
    os.makedirs(variants_dir, exist_ok=True)

    option_labels = ['A', 'B', 'C', 'D']
    option_keys = ['option_a', 'option_b', 'option_c', 'option_d']

    questions_html = ""
    for i, q in enumerate(questions, 1):
        answers_html = ""
        for label, key in zip(option_labels, option_keys):
            val = getattr(q, key, '') or ''
            answers_html += f'<span class="answer"><strong>{label})</strong> {val}</span>\n'

        questions_html += f"""<div class="question">
  <div class="q-row">
    <span class="q-no">{i}.</span>
    <div class="q-content">
      <div class="q-text">{q.question_text}</div>
      <div class="answers">{answers_html}</div>
    </div>
  </div>
</div>\n"""

    now_str = datetime.now().strftime("%d.%m.%Y")

    html = f"""<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=800">
  <title>{subject_name} — Variant #{variant_id} | Test Market</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <style>
    @page {{ size: A4; margin: 0.5in; }}
    * {{ box-sizing: border-box; }}
    body {{ font-family: Times, 'Times New Roman', serif; margin: 0; color: #111; font-size: 16px; position: relative; }}

    /* ===== WATERMARK ===== */
    .watermark {{
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 0; overflow: hidden;
    }}
    .watermark-icon {{
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 500px; height: 500px; opacity: 0.03;
    }}
    .watermark-text {{
      position: absolute; top: 0; left: 0; width: 200%; height: 200%;
      transform: rotate(-35deg); transform-origin: center center;
    }}
    .watermark-text span {{
      display: inline-block; font-size: 14px; font-weight: 700;
      color: rgba(59,130,246,0.08); white-space: nowrap;
      margin: 18px 28px; font-family: sans-serif;
    }}

    /* ===== LAYOUT ===== */
    .page-content {{ position: relative; z-index: 1; }}
    .cover {{ display: flex; align-items: center; justify-content: center; page-break-after: always; break-after: page; min-height: 90vh; }}
    .cover-inner {{ width: 100%; text-align: center; padding: 18mm 12mm; }}
    .cover-logo {{ margin-bottom: 16px; }}
    .cover-logo svg {{ width: 80px; height: 80px; opacity: 0.15; }}
    .cover-center {{ font-size: 18px; margin-bottom: 10px; color: #3b82f6; font-weight: 700; font-family: sans-serif; }}
    .cover-title {{ font-size: 28px; font-weight: 700; margin: 8px 0; }}
    .cover-subject {{ font-size: 16px; color: #333; margin-top: 4px; }}
    .cover-meta {{ font-size: 14px; color: #444; margin-top: 14px; }}
    .cover-fields {{ margin-top: 30px; max-width: 520px; margin-left: auto; margin-right: auto; text-align: left; }}
    .field-row {{ display: flex; align-items: center; gap: 10px; margin: 14px 0; }}
    .field-label {{ min-width: 100px; font-size: 14px; color: #111; font-weight: 600; }}
    .field-line {{ flex: 1; border-bottom: 1px solid #111; height: 18px; }}

    .toolbar {{ position: sticky; top: 0; background: #fff; border-bottom: 1px solid #eee; padding: 8px 12px; display: flex; gap: 8px; align-items: center; z-index: 10; }}
    .toolbar button {{ padding: 6px 14px; font-size: 14px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9; }}
    .toolbar button:hover {{ background: #eee; }}

    .header {{ text-align: center; margin-bottom: 12px; }}
    .title {{ font-size: 20px; font-weight: 700; margin: 0 0 6px 0; }}
    .subtitle {{ font-size: 12px; margin: 2px 0; color: #333; }}
    .meta {{ font-size: 10px; color: #666; }}

    .questions-container {{
      column-count: 2; column-gap: 36px;
      column-rule: 1px solid #ddd;
      padding: 8px 12px;
    }}
    .question {{ break-inside: avoid; margin-bottom: 10px; }}
    .q-row {{ display: flex; align-items: flex-start; gap: 6px; }}
    .q-no {{ color: #000; font-weight: 600; min-width: 26px; flex-shrink: 0; font-size: 12px; }}
    .q-content {{ flex: 1; font-size: 12px; }}
    .q-text {{ margin-bottom: 4px; font-size: 12px; }}
    .q-text img {{ max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ddd; border-radius: 4px; margin: 4px 0; display: block; }}

    /* ===== ANSWERS INLINE ===== */
    .answers {{ margin-top: 4px; line-height: 1.6;display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap; gap: 6px; }}
    .answer {{ font-size: 12px; display:flex; align-items: center; gap: 4px; margin-bottom: 2px; }}
    .answer img {{ max-width: 120px; height: auto; max-height: 80px; border: 1px solid #ddd; border-radius: 3px; vertical-align: middle; }}

    .section {{ padding: 8px 12px; }}
    .footer {{ text-align: center; margin-top: 20px; font-size: 10px; color: #999; }}

    @media print {{
      .toolbar {{ display: none; }}
      .question {{ page-break-inside: avoid; }}
      html, body {{ margin: 0 !important; padding: 0 !important; font-size: 14px !important; overflow: visible !important; }}
      .cover {{ page-break-after: always !important; break-after: page !important; }}
      .watermark {{ position: fixed; }}
    }}
  </style>
</head>
<body>
  <!-- Watermark layer -->
  <div class="watermark">
    <svg class="watermark-icon" viewBox="0 0 24 24" fill="rgba(59,130,246,0.06)">
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
    </svg>
    <div class="watermark-text">{"".join('<span>Test Market</span>' for _ in range(200))}</div>
  </div>

  <div class="page-content">
    <div class="toolbar">
      <button onclick="window.print()">🖨️ Chop etish / PDF saqlash</button>
      <span style="color:#666; font-size:13px;">Chop etish oynasida "Save as PDF"ni tanlang.</span>
    </div>

    <div class="cover">
      <div class="cover-inner">
        <div class="cover-logo">
          <svg viewBox="0 0 24 24" fill="rgba(59,130,246,0.25)"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
        </div>
        <div class="cover-center">Test Market</div>
        <div class="cover-title">{subject_name}</div>
        <div class="cover-subject">Variant #{variant_id} &mdash; {len(questions)} ta savol</div>
        <div class="cover-meta">{now_str}</div>
        <div class="cover-fields">
          <div class="field-row"><span class="field-label">F.I.Sh:</span><div class="field-line"></div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="header">
        <div class="title">{subject_name} — Variant #{variant_id}</div>
        <div class="subtitle">{len(questions)} ta savol</div>
        <div class="meta">test-market.uz &bull; {now_str}</div>
      </div>
      <div class="questions-container">
{questions_html}
      </div>
    </div>

  </div>

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
  <script>
    document.querySelectorAll('[data-latex]').forEach(function(el){{
      var latex = el.getAttribute('data-latex');
      if(latex) try {{ katex.render(latex, el, {{throwOnError:false}}); }} catch(e) {{}}
    }});
  </script>
</body>
</html>"""

    filename = f"variant_{variant_id}.html"
    filepath = os.path.join(variants_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

    return f"variants/{filename}"


def _send_link_to_telegram(telegram_id: int, subject_name: str, question_count: int, variant_id: int, html_path: str) -> tuple[bool, str | None]:
    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        return False, "TELEGRAM_BOT_TOKEN sozlanmagan"

    frontend_url = settings.FRONTEND_URL.rstrip("/")
    variant_link = f"{frontend_url}/api/uploads/{html_path}"

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    text = (
        f"✅ To'lovingiz tasdiqlandi!\n\n"
        f"📚 {subject_name}\n"
        f"❓ {question_count} ta savol\n"
        f"🆔 Variant: #{variant_id}\n\n"
        f"Javoblarni shu chatga yuboring:\n"
        f"<b>{variant_id}:ABCDABCD...</b>\n\n"
        f"Omad tilaymiz!"
    )

    data = {
        "chat_id": telegram_id,
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": [[
                {"text": "📝 Testni ochish", "url": variant_link}
            ]]
        },
    }

    try:
        resp = requests.post(url, json=data, timeout=30)
        if resp.status_code == 200:
            return True, None
        return False, f"Telegram API xato: {resp.status_code} — {resp.text[:300]}"
    except Exception as e:
        return False, f"Request xato: {str(e)}"
