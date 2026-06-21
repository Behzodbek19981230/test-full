"""
Word (.docx) test import parser.
Supports: text, bold/italic, images, Word math equations (OMML → LaTeX).

Expected template format:
---
1. Savol matni (formula va rasm bo'lishi mumkin)
A) Variant A
B) Variant B
C) Variant C
D) Variant D
+: A

2. Keyingi savol...
---
"""

import os
import re
import uuid
from io import BytesIO
from lxml import etree
from docx import Document
from docx.oxml.ns import qn

MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math'


# =====================================================================
#  OMML → LaTeX converter
# =====================================================================

def omml_to_latex(math_elem) -> str:
    parts: list[str] = []
    _convert_element(math_elem, parts)
    return ''.join(parts).strip()


def _convert_element(elem, parts):
    tag = etree.QName(elem.tag).localname if isinstance(elem.tag, str) else ''

    if tag == 'r':
        text = ''
        for child in elem:
            lt = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''
            if lt == 't':
                text += (child.text or '')
        text = text.replace(' ', '')
        text = _escape_latex(text)
        parts.append(text)
        return

    if tag == 'f':
        num = elem.find(f'{{{MATH_NS}}}num')
        den = elem.find(f'{{{MATH_NS}}}den')
        parts.append('\\frac{')
        if num is not None:
            for child in num:
                _convert_element(child, parts)
        parts.append('}{')
        if den is not None:
            for child in den:
                _convert_element(child, parts)
        parts.append('}')
        return

    if tag == 'rad':
        deg = elem.find(f'{{{MATH_NS}}}deg')
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        deg_text = _get_text(deg) if deg is not None else ''
        if deg_text and deg_text.strip() and deg_text.strip() != '2':
            parts.append(f'\\sqrt[{deg_text.strip()}]{{')
        else:
            parts.append('\\sqrt{')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        parts.append('}')
        return

    if tag == 'sSup':
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        sup = elem.find(f'{{{MATH_NS}}}sup')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        parts.append('^{')
        if sup is not None:
            for child in sup:
                _convert_element(child, parts)
        parts.append('}')
        return

    if tag == 'sSub':
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        sub = elem.find(f'{{{MATH_NS}}}sub')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        parts.append('_{')
        if sub is not None:
            for child in sub:
                _convert_element(child, parts)
        parts.append('}')
        return

    if tag == 'sSubSup':
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        sub = elem.find(f'{{{MATH_NS}}}sub')
        sup = elem.find(f'{{{MATH_NS}}}sup')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        parts.append('_{')
        if sub is not None:
            for child in sub:
                _convert_element(child, parts)
        parts.append('}^{')
        if sup is not None:
            for child in sup:
                _convert_element(child, parts)
        parts.append('}')
        return

    if tag == 'nary':
        chr_elem = elem.find(f'{{{MATH_NS}}}naryPr/{{{MATH_NS}}}chr')
        char = chr_elem.get(qn('m:val')) if chr_elem is not None else '∫'
        sub = elem.find(f'{{{MATH_NS}}}sub')
        sup = elem.find(f'{{{MATH_NS}}}sup')
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        symbol_map = {'∫': '\\int', '∑': '\\sum', '∏': '\\prod', '∮': '\\oint'}
        parts.append(symbol_map.get(char, '\\int'))
        if sub is not None:
            parts.append('_{')
            for child in sub:
                _convert_element(child, parts)
            parts.append('}')
        if sup is not None:
            parts.append('^{')
            for child in sup:
                _convert_element(child, parts)
            parts.append('}')
        parts.append(' ')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        return

    if tag == 'd':
        beg = '('
        end_char = ')'
        beg_chr = elem.find(f'{{{MATH_NS}}}dPr/{{{MATH_NS}}}begChr')
        end_chr = elem.find(f'{{{MATH_NS}}}dPr/{{{MATH_NS}}}endChr')
        if beg_chr is not None:
            beg = beg_chr.get(qn('m:val'), '(')
        if end_chr is not None:
            end_char = end_chr.get(qn('m:val'), ')')
        beg_map = {'(': '(', '[': '[', '{': '\\{', '|': '|', '‖': '\\|'}
        end_map = {')': ')', ']': ']', '}': '\\}', '|': '|', '‖': '\\|'}
        parts.append(beg_map.get(beg, beg))
        e_elems = elem.findall(f'{{{MATH_NS}}}e')
        for i, e in enumerate(e_elems):
            if i > 0:
                parts.append(', ')
            for child in e:
                _convert_element(child, parts)
        parts.append(end_map.get(end_char, end_char))
        return

    if tag == 'func':
        fname = elem.find(f'{{{MATH_NS}}}fName')
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        if fname is not None:
            text = _get_text(fname)
            func_map = {'sin': '\\sin', 'cos': '\\cos', 'tan': '\\tan',
                        'log': '\\log', 'ln': '\\ln', 'lim': '\\lim',
                        'max': '\\max', 'min': '\\min'}
            parts.append(func_map.get(text.strip(), text.strip()))
        if e_elem is not None:
            parts.append('(')
            for child in e_elem:
                _convert_element(child, parts)
            parts.append(')')
        return

    if tag == 'acc':
        acc_chr = elem.find(f'{{{MATH_NS}}}accPr/{{{MATH_NS}}}chr')
        char = acc_chr.get(qn('m:val'), '^') if acc_chr is not None else '^'
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        acc_map = {'̂': '\\hat', '⃗': '\\vec', '̄': '\\bar', '̇': '\\dot', '̈': '\\ddot',
                   '→': '\\vec', '~': '\\tilde'}
        cmd = acc_map.get(char, '\\hat')
        parts.append(f'{cmd}{{')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        parts.append('}')
        return

    if tag == 'bar':
        e_elem = elem.find(f'{{{MATH_NS}}}e')
        parts.append('\\overline{')
        if e_elem is not None:
            for child in e_elem:
                _convert_element(child, parts)
        parts.append('}')
        return

    for child in elem:
        _convert_element(child, parts)


def _get_text(elem) -> str:
    parts = []
    for el in elem.iter():
        lt = etree.QName(el.tag).localname if isinstance(el.tag, str) else ''
        if lt == 't' and el.text:
            parts.append(el.text)
    return ''.join(parts)


def _escape_latex(text: str) -> str:
    replacements = {
        '×': '\\times ', '÷': '\\div ', '±': '\\pm ', '∓': '\\mp ',
        '≠': '\\neq ', '≤': '\\leq ', '≥': '\\geq ', '≈': '\\approx ',
        '∞': '\\infty ', '°': '^\\circ ', '√': '\\sqrt', 'π': '\\pi ',
        'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ',
        'ε': '\\varepsilon ', 'θ': '\\theta ', 'λ': '\\lambda ', 'μ': '\\mu ',
        'ν': '\\nu ', 'σ': '\\sigma ', 'φ': '\\varphi ', 'ω': '\\omega ',
        'Δ': '\\Delta ', 'Σ': '\\Sigma ', 'Ω': '\\Omega ', 'Φ': '\\Phi ',
        '→': '\\rightarrow ', '←': '\\leftarrow ', '↔': '\\leftrightarrow ',
        '⇒': '\\Rightarrow ', '⇔': '\\Leftrightarrow ',
        '∈': '\\in ', '∉': '\\notin ', '⊂': '\\subset ', '∪': '\\cup ', '∩': '\\cap ',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text


# =====================================================================
#  Paragraph → lines (handle <w:br/> line breaks)
# =====================================================================

def _extract_lines(paragraph, doc, upload_dir: str) -> list[dict]:
    """
    Extract paragraph content, splitting by <w:br/> into separate lines.
    Returns list of {'plain': str, 'html': str} for each line.
    """
    p_elem = paragraph._element
    lines: list[dict] = []
    cur_plain: list[str] = []
    cur_html: list[str] = []

    for child in p_elem:
        tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''

        if tag == 'r':
            _process_run_lines(child, doc, upload_dir, cur_plain, cur_html, lines)

        elif tag == 'oMath' or child.tag == f'{{{MATH_NS}}}oMath':
            latex = omml_to_latex(child)
            if latex:
                cur_plain.append(latex)
                cur_html.append(f'<span data-math="" data-latex="{_html_escape(latex)}" class="math-node"></span>')

        elif tag == 'oMathPara' or child.tag == f'{{{MATH_NS}}}oMathPara':
            for math_elem in child.findall(f'{{{MATH_NS}}}oMath'):
                latex = omml_to_latex(math_elem)
                if latex:
                    cur_plain.append(latex)
                    cur_html.append(f'<span data-math="" data-latex="{_html_escape(latex)}" class="math-node"></span>')

    # flush last line
    if cur_plain or cur_html:
        lines.append({'plain': ''.join(cur_plain).strip(), 'html': ''.join(cur_html).strip()})

    return lines


def _process_run_lines(run_elem, doc, upload_dir, cur_plain, cur_html, lines):
    """Process run, splitting on <w:br/> into separate lines."""
    rpr = run_elem.find(qn('w:rPr'))
    is_bold = rpr is not None and rpr.find(qn('w:b')) is not None
    is_italic = rpr is not None and rpr.find(qn('w:i')) is not None
    is_sub = False
    is_sup = False
    if rpr is not None:
        vert = rpr.find(qn('w:vertAlign'))
        if vert is not None:
            val = vert.get(qn('w:val'), '')
            is_sub = val == 'subscript'
            is_sup = val == 'superscript'

    for child in run_elem:
        child_tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''

        if child_tag == 'br':
            # Line break — flush current line and start new one
            lines.append({'plain': ''.join(cur_plain).strip(), 'html': ''.join(cur_html).strip()})
            cur_plain.clear()
            cur_html.clear()

        elif child_tag == 't':
            text = child.text or ''
            if text:
                cur_plain.append(text)
                escaped = _html_escape(text)
                if is_bold:
                    escaped = f'<strong>{escaped}</strong>'
                if is_italic:
                    escaped = f'<em>{escaped}</em>'
                if is_sub:
                    escaped = f'<sub>{escaped}</sub>'
                if is_sup:
                    escaped = f'<sup>{escaped}</sup>'
                cur_html.append(escaped)

        elif child_tag == 'drawing':
            img_url = _extract_image(child, doc, upload_dir)
            if img_url:
                cur_plain.append('[img]')
                cur_html.append(f'<img src="{img_url}" data-resizable="" width="300" />')

        elif child_tag in ('pict', 'object'):
            img_url = _extract_image_legacy(child, doc, upload_dir)
            if img_url:
                cur_plain.append('[img]')
                cur_html.append(f'<img src="{img_url}" data-resizable="" width="300" />')


# =====================================================================
#  Image extraction
# =====================================================================

def _extract_image(drawing_elem, doc, upload_dir: str) -> str | None:
    blip_elems = drawing_elem.iter(qn('a:blip'))
    for blip in blip_elems:
        embed = blip.get(qn('r:embed'))
        if embed:
            return _save_image_by_rel(doc, embed, upload_dir)
    return None


def _extract_image_legacy(elem, doc, upload_dir: str) -> str | None:
    for child in elem.iter():
        tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''
        if tag == 'imagedata':
            rel_id = child.get(qn('r:id'))
            if rel_id:
                return _save_image_by_rel(doc, rel_id, upload_dir)
    return None


def _save_image_by_rel(doc, rel_id: str, upload_dir: str) -> str | None:
    try:
        rel = doc.part.rels[rel_id]
        image_data = rel.target_part.blob
        content_type = rel.target_part.content_type
        ext_map = {
            'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
            'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg',
            'image/x-emf': 'png', 'image/x-wmf': 'png',
        }
        ext = ext_map.get(content_type, 'png')
        filename = f"{uuid.uuid4().hex[:12]}.{ext}"
        img_dir = os.path.join(upload_dir, "questions")
        os.makedirs(img_dir, exist_ok=True)
        filepath = os.path.join(img_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        return f"/api/uploads/questions/{filename}"
    except (KeyError, AttributeError):
        return None


def _html_escape(text: str) -> str:
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


# =====================================================================
#  Inline option splitter
# =====================================================================

_INLINE_OPT_PAT = re.compile(r'[*+]?[AaBbCcDd][).]')


def _split_by_options(text: str) -> list[str]:
    """Split text at option boundaries (A), *B), etc). Returns list of parts."""
    matches = list(_INLINE_OPT_PAT.finditer(text))
    if len(matches) < 3:
        return [text]
    parts = []
    prev = 0
    for m in matches:
        before = text[prev:m.start()].strip()
        if before:
            parts.append(before)
        prev = m.start()
    parts.append(text[prev:].strip())
    return parts


# =====================================================================
#  Main parser
# =====================================================================

_Q_START = re.compile(r'^(\d+)\s*[.)]\s*')
_OPT_START = re.compile(r'^([*+])?\s*([AaBbCcDd])\s*[.)]\s*')
_ANS_LINE = re.compile(r'^(?:\+:|[Jj]avob:|[Aa]nswer:)\s*([AaBbCcDd])')


def parse_docx(file_bytes: bytes, upload_dir: str) -> list[dict]:
    """
    Parse a .docx file and return list of questions.
    Each question: {question_text, option_a, option_b, option_c, option_d, correct_option}
    """
    doc = Document(BytesIO(file_bytes))

    # Step 1: Extract all lines (splitting paragraphs by <w:br/>)
    all_lines: list[dict] = []  # [{'plain': str, 'html': str}, ...]
    for para in doc.paragraphs:
        para_lines = _extract_lines(para, doc, upload_dir)
        for line in para_lines:
            if line['plain'] or line['html']:
                all_lines.append(line)

    # Step 2: Further split lines that contain inline options
    expanded: list[dict] = []
    for line in all_lines:
        plain = line['plain']

        # Check if this line has a question start AND inline options after it
        q_match = _Q_START.match(plain)
        if q_match:
            after_num = plain[q_match.end():]
            parts = _split_by_options(after_num)
            if len(parts) > 1:
                # First part is question text, rest are options
                expanded.append({'plain': f"{q_match.group()}{parts[0]}", 'html': parts[0]})
                for part in parts[1:]:
                    expanded.append({'plain': part, 'html': part})
                continue

        # Check non-question lines with inline options (e.g., "A) 5*B) 3C) 6D) 1")
        parts = _split_by_options(plain)
        if len(parts) > 1:
            for part in parts:
                expanded.append({'plain': part, 'html': part})
            continue

        expanded.append(line)

    # Step 3: Parse the expanded lines into questions
    questions: list[dict] = []
    current_q: dict | None = None
    current_state = 'idle'

    for line in expanded:
        plain = line['plain'].strip()
        html = line['html'].strip()
        if not plain and not html:
            continue

        # Detect question start
        q_match = _Q_START.match(plain)
        if q_match:
            if current_q and current_q.get('question_text'):
                questions.append(current_q)
            q_text_plain = plain[q_match.end():].strip()
            q_text_html = html
            # Remove the number prefix from HTML too
            html_num_match = re.match(r'^(\d+)\s*[.)]\s*', re.sub(r'<[^>]+>', '', html))
            if html_num_match:
                # Find position after number in the html string
                stripped = re.sub(r'<[^>]+>', '', html)
                offset = html_num_match.end()
                # Try to remove number from html
                q_text_html = re.sub(r'^\d+\s*[.)]\s*', '', html, count=1)
            else:
                q_text_html = q_text_plain

            current_q = {
                'question_text': q_text_html.strip(),
                'option_a': '', 'option_b': '', 'option_c': '', 'option_d': '',
                'correct_option': 'A',
            }
            current_state = 'question'
            continue

        # Detect option
        opt_match = _OPT_START.match(plain)
        if opt_match and current_q:
            is_correct = opt_match.group(1) in ('*', '+')
            letter = opt_match.group(2).upper()
            opt_text = plain[opt_match.end():].strip()
            # Remove option prefix from html too
            opt_html = re.sub(r'^[*+]?\s*[AaBbCcDd]\s*[.)]\s*', '', html, count=1).strip()
            if not opt_html:
                opt_html = opt_text
            field = f'option_{letter.lower()}'
            if field in current_q:
                current_q[field] = opt_html
                if is_correct:
                    current_q['correct_option'] = letter
            current_state = f'option_{letter}'
            continue

        # Detect answer line
        ans_match = _ANS_LINE.match(plain)
        if ans_match and current_q:
            current_q['correct_option'] = ans_match.group(1).upper()
            current_state = 'idle'
            continue

        # Continuation
        if current_q and current_state == 'question':
            current_q['question_text'] += '<br/>' + (html or plain)
        elif current_q and current_state.startswith('option_'):
            letter = current_state[-1].lower()
            field = f'option_{letter}'
            if field in current_q:
                current_q[field] += '<br/>' + (html or plain)

    if current_q and current_q.get('question_text'):
        questions.append(current_q)

    # Cleanup
    for q in questions:
        for key in q:
            if isinstance(q[key], str):
                q[key] = q[key].strip()
                if q[key] == '<br/>':
                    q[key] = ''
                # Remove leading <br/>
                while q[key].startswith('<br/>'):
                    q[key] = q[key][5:].strip()

    return questions


def _has_content(paragraph) -> bool:
    p_elem = paragraph._element
    for child in p_elem.iter():
        tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''
        if tag in ('drawing', 'oMath', 'pict'):
            return True
    return False
