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
import base64
from io import BytesIO
from lxml import etree
from docx import Document
from docx.oxml.ns import qn

MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PIC_NS = 'http://schemas.openxmlformats.org/drawingml/2006/picture'


def omml_to_latex(math_elem) -> str:
    """Convert Office Math ML element to LaTeX (handles common cases)."""
    latex_parts = []
    _convert_element(math_elem, latex_parts)
    return ''.join(latex_parts).strip()


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
        end = ')'
        beg_chr = elem.find(f'{{{MATH_NS}}}dPr/{{{MATH_NS}}}begChr')
        end_chr = elem.find(f'{{{MATH_NS}}}dPr/{{{MATH_NS}}}endChr')
        if beg_chr is not None:
            beg = beg_chr.get(qn('m:val'), '(')
        if end_chr is not None:
            end = end_chr.get(qn('m:val'), ')')

        beg_map = {'(': '(', '[': '[', '{': '\\{', '|': '|', '‖': '\\|'}
        end_map = {')': ')', ']': ']', '}': '\\}', '|': '|', '‖': '\\|'}
        parts.append(beg_map.get(beg, beg))
        e_elems = elem.findall(f'{{{MATH_NS}}}e')
        for i, e in enumerate(e_elems):
            if i > 0:
                parts.append(', ')
            for child in e:
                _convert_element(child, parts)
        parts.append(end_map.get(end, end))
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


def _extract_paragraph_content(paragraph, doc, upload_dir: str) -> str:
    """Extract paragraph content as HTML, handling text, images, and math."""
    html_parts = []
    p_elem = paragraph._element

    for child in p_elem:
        tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''

        if tag == 'r':
            run_html = _process_run(child, doc, upload_dir)
            if run_html:
                html_parts.append(run_html)

        elif tag == 'oMath' or child.tag == f'{{{MATH_NS}}}oMath':
            latex = omml_to_latex(child)
            if latex:
                html_parts.append(f'<span data-math="" data-latex="{_html_escape(latex)}" class="math-node"></span>')

        elif tag == 'oMathPara' or child.tag == f'{{{MATH_NS}}}oMathPara':
            for math_elem in child.findall(f'{{{MATH_NS}}}oMath'):
                latex = omml_to_latex(math_elem)
                if latex:
                    html_parts.append(f'<span data-math="" data-latex="{_html_escape(latex)}" class="math-node"></span>')

    return ''.join(html_parts)


def _process_run(run_elem, doc, upload_dir: str) -> str:
    """Process a single run element (text + images)."""
    parts = []

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

        if child_tag == 't':
            text = child.text or ''
            if text:
                escaped = _html_escape(text)
                if is_bold:
                    escaped = f'<strong>{escaped}</strong>'
                if is_italic:
                    escaped = f'<em>{escaped}</em>'
                if is_sub:
                    escaped = f'<sub>{escaped}</sub>'
                if is_sup:
                    escaped = f'<sup>{escaped}</sup>'
                parts.append(escaped)

        elif child_tag == 'drawing':
            img_url = _extract_image(child, doc, upload_dir)
            if img_url:
                parts.append(f'<img src="{img_url}" data-resizable="" width="300" />')

        elif child_tag == 'pict' or child_tag == 'object':
            img_url = _extract_image_legacy(child, doc, upload_dir)
            if img_url:
                parts.append(f'<img src="{img_url}" data-resizable="" width="300" />')

    return ''.join(parts)


def _extract_image(drawing_elem, doc, upload_dir: str) -> str | None:
    """Extract image from drawing element."""
    blip_elems = drawing_elem.iter(qn('a:blip'))
    for blip in blip_elems:
        embed = blip.get(qn('r:embed'))
        if embed:
            return _save_image_by_rel(doc, embed, upload_dir)
    return None


def _extract_image_legacy(elem, doc, upload_dir: str) -> str | None:
    """Extract image from legacy VML format."""
    for child in elem.iter():
        tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''
        if tag == 'imagedata':
            rel_id = child.get(qn('r:id'))
            if rel_id:
                return _save_image_by_rel(doc, rel_id, upload_dir)
    return None


def _save_image_by_rel(doc, rel_id: str, upload_dir: str) -> str | None:
    """Save image from document relationship and return URL."""
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


def parse_docx(file_bytes: bytes, upload_dir: str) -> list[dict]:
    """
    Parse a .docx file and return list of questions.
    Each question: {question_text, option_a, option_b, option_c, option_d, correct_option}
    """
    doc = Document(BytesIO(file_bytes))
    paragraphs = doc.paragraphs
    questions = []
    current_q: dict | None = None
    current_state = 'idle'

    for para in paragraphs:
        text = para.text.strip()
        if not text and not _has_content(para):
            continue

        html_content = _extract_paragraph_content(para, doc, upload_dir)
        plain = text

        # Detect question start: "1." or "1)" at the beginning
        q_match = re.match(r'^(\d+)\s*[.)]\s*', plain)
        if q_match:
            if current_q and current_q.get('question_text'):
                questions.append(current_q)
            remaining = html_content[html_content.find(plain[q_match.end()-1:q_match.end()]) + 1:] if plain[q_match.end():] else ''
            q_text = re.sub(r'^.*?[.)]\s*', '', html_content, count=1)
            current_q = {
                'question_text': q_text.strip(),
                'option_a': '', 'option_b': '', 'option_c': '', 'option_d': '',
                'correct_option': 'A',
            }
            current_state = 'question'
            continue

        # Detect options: "A)" "A." "*A)" "+A)"
        opt_match = re.match(r'^([*+])?\s*([AaBbCcDd])\s*[.)]\s*', plain)
        if opt_match and current_q:
            is_correct = opt_match.group(1) in ('*', '+')
            letter = opt_match.group(2).upper()
            opt_content = re.sub(r'^[*+]?\s*[AaBbCcDd]\s*[.)]\s*', '', html_content, count=1)
            field = f'option_{letter.lower()}'
            if field in current_q:
                current_q[field] = opt_content.strip()
                if is_correct:
                    current_q['correct_option'] = letter
            current_state = f'option_{letter}'
            continue

        # Detect correct answer line: "+: A" or "Javob: A" or "Answer: A"
        ans_match = re.match(r'^(?:\+:|[Jj]avob:|[Aa]nswer:)\s*([AaBbCcDd])', plain)
        if ans_match and current_q:
            current_q['correct_option'] = ans_match.group(1).upper()
            current_state = 'idle'
            continue

        # Continuation of current element
        if current_q and current_state == 'question':
            current_q['question_text'] += '<br/>' + html_content.strip()
        elif current_q and current_state.startswith('option_'):
            letter = current_state[-1].lower()
            field = f'option_{letter}'
            if field in current_q:
                current_q[field] += '<br/>' + html_content.strip()

    if current_q and current_q.get('question_text'):
        questions.append(current_q)

    # Clean up empty tags
    for q in questions:
        for key in q:
            if isinstance(q[key], str):
                q[key] = q[key].strip()
                if q[key] == '<br/>':
                    q[key] = ''

    return questions


def _has_content(paragraph) -> bool:
    """Check if paragraph has non-text content (images, math)."""
    p_elem = paragraph._element
    for child in p_elem.iter():
        tag = etree.QName(child.tag).localname if isinstance(child.tag, str) else ''
        if tag in ('drawing', 'oMath', 'pict'):
            return True
    return False
