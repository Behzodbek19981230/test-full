import { useState, useEffect, useRef } from 'react'
import katex from 'katex'
import { IconMath, IconAtom, IconFlask, IconX, IconNumbers, IconLetterA } from '@tabler/icons-react'
import Button from '../ui/Button'

interface FormulaDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (latex: string) => void
  initialLatex?: string
}

type Tab = 'math' | 'physics' | 'chemistry' | 'symbols' | 'greek'

const TEMPLATES: Record<Tab, string[]> = {
  math: [
    '\\frac{a}{b}',
    '\\frac{x+1}{x-1}',
    '\\frac{d}{dx}f(x)',
    '\\frac{\\partial f}{\\partial x}',
    '\\sqrt{x}',
    '\\sqrt[n]{x}',
    '\\sqrt[3]{27}',
    'x^{n}',
    'x^{2}',
    'a^{m+n}',
    'x_{i}',
    'x_{n+1}',
    'a_{ij}',
    '\\sum_{i=1}^{n} x_i',
    '\\sum_{k=0}^{\\infty} a_k',
    '\\prod_{i=1}^{n} x_i',
    '\\int_{a}^{b} f(x)\\,dx',
    '\\int_{0}^{\\infty} e^{-x}\\,dx',
    '\\iint_{D} f(x,y)\\,dA',
    '\\oint_{C} \\vec{F} \\cdot d\\vec{r}',
    '\\lim_{x \\to \\infty} f(x)',
    '\\lim_{x \\to 0} \\frac{\\sin x}{x}',
    '\\lim_{n \\to \\infty} a_n',
    '\\log_{a} b',
    '\\ln x',
    '\\log_{10} x',
    '\\sin(\\alpha)',
    '\\cos(\\beta)',
    '\\tan(\\theta)',
    '\\cot(\\alpha)',
    '\\arcsin(x)',
    '\\arccos(x)',
    '\\sin^{2}(x) + \\cos^{2}(x) = 1',
    '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
    '\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}',
    '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}',
    '\\begin{cases} f(x) = x^2, & x \\geq 0 \\\\ f(x) = -x, & x < 0 \\end{cases}',
    '|x|',
    '\\|\\vec{a}\\|',
    '\\vec{a}',
    '\\vec{AB}',
    '\\overrightarrow{AB}',
    '\\overline{AB}',
    '\\hat{x}',
    '\\bar{x}',
    '\\dot{x}',
    '\\ddot{x}',
    '\\binom{n}{k}',
    'C_n^k',
    'A_n^k',
    'n!',
    '\\text{EKUB}(a, b)',
    '\\text{EKUK}(a, b)',
    'a \\cdot b',
    '\\vec{a} \\times \\vec{b}',
    '\\angle ABC',
    '\\triangle ABC',
    '\\perp',
    '\\parallel',
    '\\sim',
    '\\cong',
    'f: A \\to B',
    'f(x) = ax^2 + bx + c',
    'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^k b^{n-k}',
    'e^{i\\pi} + 1 = 0',
    'a^2 + b^2 = c^2',
    '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}',
    'S = \\frac{1}{2}ab\\sin C',
    'S = \\pi r^2',
    'V = \\frac{4}{3}\\pi r^3',
    'V = \\pi r^2 h',
    'f(x)',
    'f(x) = x^2',
    'f(x) = e^x',
    'f(x) = \\ln x',
    'f(x) = \\sin x',
    'f(x) = \\cos x',
    'g(x) = \\sqrt{x}',
    'f(g(x))',
    'f^{-1}(x)',
    "f'(x)",
    "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
    "f'(x) = nx^{n-1}",
    "(f \\cdot g)' = f'g + fg'",
    "\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}",
    "(f(g(x)))' = f'(g(x)) \\cdot g'(x)",
    "(e^x)' = e^x",
    "(\\ln x)' = \\frac{1}{x}",
    "(\\sin x)' = \\cos x",
    "(\\cos x)' = -\\sin x",
    "(\\tan x)' = \\frac{1}{\\cos^2 x}",
    "(x^n)' = nx^{n-1}",
    "(a^x)' = a^x \\ln a",
    "(\\log_a x)' = \\frac{1}{x \\ln a}",
    "(\\arcsin x)' = \\frac{1}{\\sqrt{1 - x^2}}",
    "(\\arccos x)' = -\\frac{1}{\\sqrt{1 - x^2}}",
    "(\\arctan x)' = \\frac{1}{1 + x^2}",
    "f''(x)",
    "f'''(x)",
    "f^{(n)}(x)",
    "y' = \\frac{dy}{dx}",
    "y'' = \\frac{d^2y}{dx^2}",
  ],
  physics: [
    'v = \\frac{s}{t}',
    's = v_0 t + \\frac{at^2}{2}',
    'v = v_0 + at',
    'v^2 = v_0^2 + 2as',
    'a = \\frac{\\Delta v}{\\Delta t}',
    'F = ma',
    'F = -kx',
    'F_{тр} = \\mu N',
    'p = mv',
    'E_k = \\frac{mv^2}{2}',
    'E_p = mgh',
    'A = Fs\\cos\\alpha',
    'P = \\frac{A}{t}',
    'P = Fv',
    'I = \\frac{F}{S}',
    'T = 2\\pi\\sqrt{\\frac{l}{g}}',
    'T = 2\\pi\\sqrt{\\frac{m}{k}}',
    '\\omega = 2\\pi\\nu',
    'v = \\omega r',
    'a_c = \\frac{v^2}{r}',
    'F = G\\frac{m_1 m_2}{r^2}',
    'g = G\\frac{M}{R^2}',
    's = \\frac{gt^2}{2}',
    'I = \\frac{U}{R}',
    'U = IR',
    'P = UI',
    'P = I^2 R',
    'P = \\frac{U^2}{R}',
    'R = \\frac{\\rho l}{S}',
    'R_{\\text{посл}} = R_1 + R_2',
    '\\frac{1}{R_{\\text{пар}}} = \\frac{1}{R_1} + \\frac{1}{R_2}',
    'I = \\frac{\\varepsilon}{R + r}',
    'F = k\\frac{q_1 q_2}{r^2}',
    'E = \\frac{F}{q}',
    'C = \\frac{q}{U}',
    'W = \\frac{CU^2}{2}',
    'C = \\varepsilon\\varepsilon_0 \\frac{S}{d}',
    '\\varepsilon = -\\frac{\\Delta\\Phi}{\\Delta t}',
    '\\Phi = BS\\cos\\alpha',
    '\\varepsilon = -L\\frac{\\Delta I}{\\Delta t}',
    '\\lambda = \\frac{v}{\\nu}',
    'E = h\\nu',
    'E = mc^2',
    'E = \\frac{p^2}{2m}',
    'PV = \\nu RT',
    'PV = NkT',
    'E_k = \\frac{3}{2}kT',
    'Q = mc\\Delta T',
    'Q = Lm',
    'Q = \\lambda m',
    '\\eta = \\frac{A_{\\text{пол}}}{Q_{\\text{зат}}}',
    '\\eta = 1 - \\frac{T_2}{T_1}',
    'n = \\frac{\\sin\\alpha}{\\sin\\beta}',
    '\\frac{1}{F} = \\frac{1}{d} + \\frac{1}{f}',
    'D = \\frac{1}{F}',
    'd\\sin\\theta = m\\lambda',
  ],
  chemistry: [
    'H_2O',
    'H_2SO_4',
    'HCl',
    'HNO_3',
    'H_3PO_4',
    'H_2CO_3',
    'HF',
    'HBr',
    'NaOH',
    'KOH',
    'Ca(OH)_2',
    'Ba(OH)_2',
    'Al(OH)_3',
    'Fe(OH)_3',
    'NaCl',
    'KNO_3',
    'CaCO_3',
    'Na_2SO_4',
    'FeSO_4',
    'CuSO_4',
    'AgNO_3',
    'BaCl_2',
    'CO_2',
    'SO_2',
    'SO_3',
    'NO_2',
    'N_2O_5',
    'P_2O_5',
    'Fe_2O_3',
    'Al_2O_3',
    'CaO',
    'Na_2O',
    'CH_4',
    'C_2H_6',
    'C_2H_4',
    'C_2H_2',
    'C_6H_6',
    'C_2H_5OH',
    'CH_3OH',
    'CH_3COOH',
    'C_6H_{12}O_6',
    'C_{12}H_{22}O_{11}',
    'NH_3',
    'NH_4Cl',
    '(NH_4)_2SO_4',
    'KMnO_4',
    'K_2Cr_2O_7',
    'Na_2CO_3',
    '\\rightarrow',
    '\\rightleftharpoons',
    '\\xrightarrow{\\Delta}',
    '\\xrightarrow{t^\\circ}',
    '\\xrightarrow{\\text{kat}}',
    '\\xrightarrow{H_2O}',
    '\\xrightarrow{\\text{эл}}',
    '\\downarrow',
    '\\uparrow',
    '2H_2 + O_2 \\rightarrow 2H_2O',
    'CaCO_3 \\xrightarrow{\\Delta} CaO + CO_2\\uparrow',
    'pH = -\\lg[H^+]',
    'K_a = \\frac{[H^+][A^-]}{[HA]}',
    'M = \\frac{m}{\\nu}',
    '\\nu = \\frac{m}{M}',
    '\\nu = \\frac{N}{N_A}',
    'C_M = \\frac{\\nu}{V}',
    'w = \\frac{m_{\\text{в-ва}}}{m_{\\text{р-ра}}}',
  ],
  symbols: [
    '\\neq',
    '\\approx',
    '\\equiv',
    '\\geq',
    '\\leq',
    '\\gg',
    '\\ll',
    '\\pm',
    '\\mp',
    '\\times',
    '\\div',
    '\\cdot',
    '\\infty',
    '\\propto',
    '\\sim',
    '\\simeq',
    '\\subset',
    '\\supset',
    '\\subseteq',
    '\\supseteq',
    '\\in',
    '\\notin',
    '\\cup',
    '\\cap',
    '\\emptyset',
    '\\forall',
    '\\exists',
    '\\nexists',
    '\\neg',
    '\\land',
    '\\lor',
    '\\Rightarrow',
    '\\Leftrightarrow',
    '\\rightarrow',
    '\\leftarrow',
    '\\leftrightarrow',
    '\\uparrow',
    '\\downarrow',
    '\\nearrow',
    '\\searrow',
    '\\partial',
    '\\nabla',
    '\\hbar',
    '\\ell',
    '\\Re',
    '\\Im',
    '\\aleph',
    '\\wp',
    '\\mathbb{N}',
    '\\mathbb{Z}',
    '\\mathbb{Q}',
    '\\mathbb{R}',
    '\\mathbb{C}',
    '\\ldots',
    '\\cdots',
    '\\vdots',
    '\\ddots',
    '\\circ',
    '\\bullet',
    '\\star',
    '\\dagger',
    '\\oplus',
    '\\otimes',
  ],
  greek: [
    '\\alpha',
    '\\beta',
    '\\gamma',
    '\\delta',
    '\\epsilon',
    '\\varepsilon',
    '\\zeta',
    '\\eta',
    '\\theta',
    '\\vartheta',
    '\\iota',
    '\\kappa',
    '\\lambda',
    '\\mu',
    '\\nu',
    '\\xi',
    '\\pi',
    '\\rho',
    '\\sigma',
    '\\tau',
    '\\upsilon',
    '\\phi',
    '\\varphi',
    '\\chi',
    '\\psi',
    '\\omega',
    '\\Gamma',
    '\\Delta',
    '\\Theta',
    '\\Lambda',
    '\\Xi',
    '\\Pi',
    '\\Sigma',
    '\\Upsilon',
    '\\Phi',
    '\\Psi',
    '\\Omega',
  ],
}

const QUICK_SYMBOLS: Record<Tab, { label: string; latex: string }[]> = {
  math: [
    { label: 'π', latex: '\\pi' },
    { label: '∞', latex: '\\infty' },
    { label: '√', latex: '\\sqrt{}' },
    { label: '±', latex: '\\pm' },
    { label: '≠', latex: '\\neq' },
    { label: '≈', latex: '\\approx' },
    { label: '≤', latex: '\\leq' },
    { label: '≥', latex: '\\geq' },
    { label: '°', latex: '^{\\circ}' },
    { label: '²', latex: '^{2}' },
    { label: '³', latex: '^{3}' },
    { label: 'ⁿ', latex: '^{n}' },
    { label: '½', latex: '\\frac{1}{2}' },
    { label: '⅓', latex: '\\frac{1}{3}' },
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'θ', latex: '\\theta' },
    { label: 'φ', latex: '\\varphi' },
    { label: 'Δ', latex: '\\Delta' },
    { label: 'Σ', latex: '\\Sigma' },
    { label: '∫', latex: '\\int' },
    { label: '∂', latex: '\\partial' },
    { label: '→', latex: '\\to' },
    { label: '⇒', latex: '\\Rightarrow' },
    { label: '∈', latex: '\\in' },
    { label: '∅', latex: '\\emptyset' },
    { label: '∠', latex: '\\angle' },
    { label: '△', latex: '\\triangle' },
    { label: '⊥', latex: '\\perp' },
    { label: '∥', latex: '\\parallel' },
    { label: "f'", latex: "f'(x)" },
    { label: "f''", latex: "f''(x)" },
    { label: 'dy/dx', latex: '\\frac{dy}{dx}' },
  ],
  physics: [
    { label: 'Δ', latex: '\\Delta' },
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'γ', latex: '\\gamma' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'μ', latex: '\\mu' },
    { label: 'ν', latex: '\\nu' },
    { label: 'ω', latex: '\\omega' },
    { label: 'ε', latex: '\\varepsilon' },
    { label: 'ρ', latex: '\\rho' },
    { label: 'σ', latex: '\\sigma' },
    { label: 'τ', latex: '\\tau' },
    { label: 'Φ', latex: '\\Phi' },
    { label: 'Ω', latex: '\\Omega' },
    { label: 'π', latex: '\\pi' },
    { label: '∞', latex: '\\infty' },
    { label: '°', latex: '^{\\circ}' },
    { label: '°C', latex: '^{\\circ}C' },
    { label: '²', latex: '^{2}' },
    { label: '³', latex: '^{3}' },
    { label: '±', latex: '\\pm' },
    { label: '≈', latex: '\\approx' },
    { label: '→', latex: '\\to' },
    { label: 'ℏ', latex: '\\hbar' },
    { label: 'ε₀', latex: '\\varepsilon_0' },
    { label: 'μ₀', latex: '\\mu_0' },
    { label: '·', latex: '\\cdot' },
    { label: '×', latex: '\\times' },
    { label: '⃗', latex: '\\vec{}' },
  ],
  chemistry: [
    { label: '→', latex: '\\rightarrow' },
    { label: '⇌', latex: '\\rightleftharpoons' },
    { label: '↑', latex: '\\uparrow' },
    { label: '↓', latex: '\\downarrow' },
    { label: 'Δ→', latex: '\\xrightarrow{\\Delta}' },
    { label: 't°→', latex: '\\xrightarrow{t^\\circ}' },
    { label: 'kat→', latex: '\\xrightarrow{\\text{kat}}' },
    { label: '²⁺', latex: '^{2+}' },
    { label: '³⁺', latex: '^{3+}' },
    { label: '⁺', latex: '^{+}' },
    { label: '⁻', latex: '^{-}' },
    { label: '²⁻', latex: '^{2-}' },
    { label: '₂', latex: '_2' },
    { label: '₃', latex: '_3' },
    { label: '₄', latex: '_4' },
    { label: '°C', latex: '^{\\circ}C' },
    { label: 'ΔH', latex: '\\Delta H' },
    { label: 'ΔG', latex: '\\Delta G' },
    { label: '≈', latex: '\\approx' },
    { label: '·', latex: '\\cdot' },
  ],
  symbols: [],
  greek: [],
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'math', label: 'Matematika', icon: <IconMath size={15} /> },
  { key: 'physics', label: 'Fizika', icon: <IconAtom size={15} /> },
  { key: 'chemistry', label: 'Kimyo', icon: <IconFlask size={15} /> },
  { key: 'symbols', label: 'Belgilar', icon: <IconNumbers size={15} /> },
  { key: 'greek', label: 'Grek', icon: <IconLetterA size={15} /> },
]

export default function FormulaDialog({ open, onClose, onInsert, initialLatex = '' }: FormulaDialogProps) {
  const [latex, setLatex] = useState(initialLatex)
  const [tab, setTab] = useState<Tab>('math')
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('fd-width')
    return saved ? Math.max(320, Math.min(Number(saved), 1200)) : 420
  })
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const resizing = useRef(false)

  useEffect(() => {
    if (open) {
      setLatex(initialLatex)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, initialLatex])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = true
    const startX = e.clientX
    const startWidth = drawerWidth

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      const delta = startX - ev.clientX
      const newWidth = Math.min(Math.max(startWidth + delta, 320), window.innerWidth * 0.9)
      setDrawerWidth(newWidth)
    }
    const onUp = () => {
      resizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      const el = drawerRef.current
      if (el) localStorage.setItem('fd-width', String(el.offsetWidth))
    }
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    if (previewRef.current && latex.trim()) {
      try {
        katex.render(latex, previewRef.current, { throwOnError: false, displayMode: true })
      } catch {
        if (previewRef.current) previewRef.current.textContent = latex
      }
    } else if (previewRef.current) {
      previewRef.current.innerHTML = '<span class="fd-preview-placeholder">Formula bu yerda ko\'rinadi</span>'
    }
  }, [latex])

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex.trim())
      setLatex('')
      onClose()
    }
  }

  const insertTemplate = (tmpl: string) => {
    setLatex(prev => {
      const textarea = inputRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newVal = prev.slice(0, start) + tmpl + prev.slice(end)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tmpl.length
          textarea.focus()
        }, 0)
        return newVal
      }
      return prev ? prev + ' ' + tmpl : tmpl
    })
  }

  return (
    <>
      <div className={`fd-overlay ${open ? 'fd-overlay--open' : ''}`} onClick={onClose} />
      <div ref={drawerRef} className={`fd-drawer ${open ? 'fd-drawer--open' : ''}`} style={window.innerWidth > 480 ? { width: drawerWidth } : undefined}>
        <div className="fd-resize-handle" onMouseDown={handleResizeStart} />
        <div className="fd-header">
          <div className="fd-header__title">
            <IconMath size={20} />
            <span>Formula qo'shish</span>
          </div>
          <button className="fd-header__close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="fd-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`fd-tab ${tab === t.key ? 'fd-tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="fd-body">
          {QUICK_SYMBOLS[tab].length > 0 && (
            <>
              <div className="fd-section-label">Tez belgilar</div>
              <div className="fd-quick-symbols">
                {QUICK_SYMBOLS[tab].map((s, i) => (
                  <button
                    key={`${tab}-qs-${i}`}
                    className="fd-quick-btn"
                    onClick={() => insertTemplate(s.latex)}
                    title={s.latex}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="fd-section-label">Formulalar</div>
            </>
          )}
          <div className="fd-templates">
            {TEMPLATES[tab].map((tmpl, i) => {
              const ref = (el: HTMLButtonElement | null) => {
                if (el) {
                  try {
                    katex.render(tmpl, el, { throwOnError: false })
                  } catch { /* skip */ }
                }
              }
              return (
                <button
                  key={`${tab}-${i}`}
                  ref={ref}
                  className="fd-tmpl"
                  onClick={() => insertTemplate(tmpl)}
                />
              )
            })}
          </div>

          <div className="fd-section-label">LaTeX kod</div>
          <textarea
            ref={inputRef}
            className="fd-input"
            value={latex}
            onChange={e => setLatex(e.target.value)}
            placeholder="Masalan: \frac{a}{b} yoki H_2O"
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleInsert() }}
          />

          <div className="fd-section-label">Ko'rinishi</div>
          <div className="fd-preview" ref={previewRef} />
        </div>

        <div className="fd-footer">
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={handleInsert} disabled={!latex.trim()}>
            Qo'shish
          </Button>
        </div>
      </div>
    </>
  )
}
