import { useState, useEffect, useRef, useCallback } from 'react'
import katex from 'katex'
import {
  IconMath, IconAtom, IconFlask, IconX, IconNumbers, IconLetterA,
  IconChartLine, IconPlus, IconTrash,
} from '@tabler/icons-react'
import Button from '../ui/Button'

interface FormulaDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (latex: string) => void
  onInsertImage?: (dataUrl: string) => void
  initialLatex?: string
}

type Tab = 'math' | 'physics' | 'chemistry' | 'symbols' | 'greek' | 'graph'

interface GraphFunction {
  expr: string
  color: string
}

const GRAPH_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#be185d', '#854d0e']

// ——— Math expression evaluator ———

type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string }
  | { type: 'lparen'; value: '(' }
  | { type: 'rparen'; value: ')' }

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (ch === ' ' || ch === '\t') { i++; continue }
    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = ''
      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
        num += expr[i++]
      }
      tokens.push({ type: 'number', value: parseFloat(num) })
    } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      let id = ''
      while (i < expr.length && ((expr[i] >= 'a' && expr[i] <= 'z') || (expr[i] >= 'A' && expr[i] <= 'Z'))) {
        id += expr[i++]
      }
      tokens.push({ type: 'ident', value: id })
    } else if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
    } else if (ch === '(') {
      tokens.push({ type: 'lparen', value: '(' })
      i++
    } else if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')' })
      i++
    } else {
      i++
    }
  }
  return tokens
}

const MATH_FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  cot: (x) => 1 / Math.tan(x),
  sec: (x) => 1 / Math.cos(x),
  csc: (x) => 1 / Math.sin(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sqrt: Math.sqrt, cbrt: Math.cbrt,
  abs: Math.abs, sign: Math.sign,
  ln: Math.log, log: Math.log10,
  exp: Math.exp,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
}

const MATH_CONSTS: Record<string, number> = {
  pi: Math.PI, e: Math.E,
}

class ExprParser {
  private tokens: Token[]
  private pos = 0
  private x: number

  constructor(tokens: Token[], x: number) {
    this.tokens = tokens
    this.x = x
  }

  private peek(): Token | undefined { return this.tokens[this.pos] }
  private consume(): Token { return this.tokens[this.pos++] }

  parse(): number {
    const r = this.expr()
    return r
  }

  private expr(): number {
    let left = this.term()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = (this.consume() as { type: 'op'; value: string }).value
      const right = this.term()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  private term(): number {
    let left = this.power()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op = (this.consume() as { type: 'op'; value: string }).value
      const right = this.power()
      left = op === '*' ? left * right : left / right
    }
    return left
  }

  private power(): number {
    let base = this.unary()
    if (this.peek()?.type === 'op' && this.peek()!.value === '^') {
      this.consume()
      const exp = this.power()
      base = Math.pow(base, exp)
    }
    return base
  }

  private unary(): number {
    if (this.peek()?.type === 'op' && this.peek()!.value === '-') {
      this.consume()
      return -this.unary()
    }
    if (this.peek()?.type === 'op' && this.peek()!.value === '+') {
      this.consume()
      return this.unary()
    }
    return this.atom()
  }

  private atom(): number {
    const tok = this.peek()
    if (!tok) return NaN

    if (tok.type === 'number') {
      this.consume()
      if (this.peek()?.type === 'ident' || this.peek()?.type === 'lparen') {
        return tok.value * this.atom()
      }
      return tok.value
    }

    if (tok.type === 'ident') {
      this.consume()
      const name = tok.value.toLowerCase()

      if (name === 'x') return this.x

      if (MATH_CONSTS[name] !== undefined) {
        if (this.peek()?.type === 'ident' || this.peek()?.type === 'lparen') {
          return MATH_CONSTS[name] * this.atom()
        }
        return MATH_CONSTS[name]
      }

      if (MATH_FUNCS[name]) {
        if (this.peek()?.type === 'lparen') {
          this.consume()
          const arg = this.expr()
          if (this.peek()?.type === 'rparen') this.consume()
          const result = MATH_FUNCS[name](arg)
          if (this.peek()?.type === 'lparen' || this.peek()?.type === 'number') {
            return result * this.atom()
          }
          return result
        }
        return MATH_FUNCS[name](this.unary())
      }

      return NaN
    }

    if (tok.type === 'lparen') {
      this.consume()
      const val = this.expr()
      if (this.peek()?.type === 'rparen') this.consume()
      if (this.peek()?.type === 'ident' || this.peek()?.type === 'lparen' || this.peek()?.type === 'number') {
        return val * this.atom()
      }
      return val
    }

    return NaN
  }
}

function evalExpr(expr: string, x: number): number {
  try {
    return new ExprParser(tokenize(expr), x).parse()
  } catch {
    return NaN
  }
}

// ——— Graph drawing utilities ———

function niceStep(range: number, targetSteps = 8): number {
  if (range <= 0) return 1
  const rough = range / targetSteps
  const exp = Math.floor(Math.log10(rough))
  const frac = rough / Math.pow(10, exp)
  let nice: number
  if (frac <= 1.5) nice = 1
  else if (frac <= 3) nice = 2
  else if (frac <= 7) nice = 5
  else nice = 10
  return nice * Math.pow(10, exp)
}

function formatAxisNum(n: number): string {
  if (n === 0) return '0'
  if (Math.abs(n) >= 10000 || (Math.abs(n) < 0.01 && n !== 0)) {
    return n.toExponential(1)
  }
  const s = parseFloat(n.toPrecision(6)).toString()
  return s.length > 7 ? parseFloat(n.toPrecision(3)).toString() : s
}

function computeAutoYRange(fns: GraphFunction[], xMin: number, xMax: number): { min: number; max: number } {
  let lo = Infinity, hi = -Infinity
  const steps = 600
  for (const fn of fns) {
    if (!fn.expr.trim()) continue
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin)
      const y = evalExpr(fn.expr, x)
      if (isFinite(y) && Math.abs(y) < 1e8) {
        lo = Math.min(lo, y)
        hi = Math.max(hi, y)
      }
    }
  }
  if (!isFinite(lo) || !isFinite(hi) || lo === hi) return { min: -10, max: 10 }
  const pad = (hi - lo) * 0.12 || 1
  return { min: lo - pad, max: hi + pad }
}

function drawGraph(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  fns: GraphFunction[],
  xMin: number, xMax: number,
  yMin: number, yMax: number,
  showGrid: boolean,
) {
  const pad = { top: 20, right: 20, bottom: 36, left: 48 }
  const pw = w - pad.left - pad.right
  const ph = h - pad.top - pad.bottom

  const mx = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * pw
  const my = (y: number) => pad.top + ((yMax - y) / (yMax - yMin)) * ph

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // Grid & labels
  const xStep = niceStep(xMax - xMin)
  const yStep = niceStep(yMax - yMin)

  ctx.font = '11px system-ui, -apple-system, sans-serif'

  if (showGrid) {
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5

    let gx = Math.ceil(xMin / xStep) * xStep
    while (gx <= xMax + xStep * 0.01) {
      const cx = mx(gx)
      if (cx >= pad.left && cx <= pad.left + pw) {
        ctx.beginPath(); ctx.moveTo(cx, pad.top); ctx.lineTo(cx, pad.top + ph); ctx.stroke()
      }
      gx += xStep
    }
    let gy = Math.ceil(yMin / yStep) * yStep
    while (gy <= yMax + yStep * 0.01) {
      const cy = my(gy)
      if (cy >= pad.top && cy <= pad.top + ph) {
        ctx.beginPath(); ctx.moveTo(pad.left, cy); ctx.lineTo(pad.left + pw, cy); ctx.stroke()
      }
      gy += yStep
    }
  }

  // Axes
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 1.5
  if (yMin <= 0 && yMax >= 0) {
    const y0 = my(0)
    ctx.beginPath(); ctx.moveTo(pad.left, y0); ctx.lineTo(pad.left + pw, y0); ctx.stroke()
  }
  if (xMin <= 0 && xMax >= 0) {
    const x0 = mx(0)
    ctx.beginPath(); ctx.moveTo(x0, pad.top); ctx.lineTo(x0, pad.top + ph); ctx.stroke()
  }

  // Tick labels
  ctx.fillStyle = '#6b7280'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  let tx = Math.ceil(xMin / xStep) * xStep
  while (tx <= xMax + xStep * 0.01) {
    const cx = mx(tx)
    if (cx >= pad.left && cx <= pad.left + pw) {
      ctx.fillText(formatAxisNum(tx), cx, pad.top + ph + 6)
    }
    tx += xStep
  }
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  let ty = Math.ceil(yMin / yStep) * yStep
  while (ty <= yMax + yStep * 0.01) {
    const cy = my(ty)
    if (cy >= pad.top && cy <= pad.top + ph) {
      ctx.fillText(formatAxisNum(ty), pad.left - 6, cy)
    }
    ty += yStep
  }

  // Border
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  ctx.strokeRect(pad.left, pad.top, pw, ph)

  // Clip
  ctx.save()
  ctx.beginPath()
  ctx.rect(pad.left, pad.top, pw, ph)
  ctx.clip()

  // Curves
  const steps = Math.max(pw * 2, 800)
  const yRange = yMax - yMin
  for (const fn of fns) {
    if (!fn.expr.trim()) continue
    ctx.strokeStyle = fn.color
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.beginPath()

    let drawing = false
    let prevY: number | null = null

    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin)
      const y = evalExpr(fn.expr, x)

      if (!isFinite(y) || isNaN(y)) {
        drawing = false
        prevY = null
        continue
      }

      if (prevY !== null && Math.abs(y - prevY) > yRange * 4) {
        drawing = false
      }

      const cx = mx(x)
      const cy = my(y)

      if (!drawing) {
        ctx.moveTo(cx, cy)
        drawing = true
      } else {
        ctx.lineTo(cx, cy)
      }
      prevY = y
    }
    ctx.stroke()
  }

  ctx.restore()

  // Legend
  const validFns = fns.filter(f => f.expr.trim())
  if (validFns.length > 0) {
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    const labels = validFns.map(f => `y = ${f.expr}`)
    const maxLabelW = Math.max(...labels.map(l => ctx.measureText(l).width))
    const lw = maxLabelW + 36
    const lh = validFns.length * 20 + 10
    const lx = pad.left + 8
    const ly = pad.top + 8

    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(lx, ly, lw, lh, 4)
    ctx.fill()
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    validFns.forEach((fn, i) => {
      const cy = ly + 5 + i * 20 + 10
      ctx.strokeStyle = fn.color
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(lx + 6, cy); ctx.lineTo(lx + 22, cy); ctx.stroke()
      ctx.fillStyle = '#374151'
      ctx.fillText(labels[i], lx + 28, cy)
    })
  }
}

// ——— Templates & tabs ———

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
    '\\{1, 2, 3\\}',
    '\\{x \\mid x > 0\\}',
    '\\{x \\in \\mathbb{R} \\mid x \\geq 0\\}',
    'A = \\{a_1, a_2, \\ldots, a_n\\}',
    '[a, b]',
    '(a, b)',
    '[a, b)',
    '(a, b]',
    '(-\\infty, +\\infty)',
    '[0, +\\infty)',
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
  graph: [],
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
    { label: '{ }', latex: '\\{ \\}' },
    { label: '[ ]', latex: '[ ]' },
    { label: '⟨ ⟩', latex: '\\langle \\rangle' },
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
  graph: [],
}

const GRAPH_PRESETS: { label: string; expr: string }[] = [
  { label: 'sin(x)', expr: 'sin(x)' },
  { label: 'cos(x)', expr: 'cos(x)' },
  { label: 'tan(x)', expr: 'tan(x)' },
  { label: 'x²', expr: 'x^2' },
  { label: 'x³', expr: 'x^3' },
  { label: '√x', expr: 'sqrt(x)' },
  { label: '1/x', expr: '1/x' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: 'ln(x)', expr: 'ln(x)' },
  { label: '|x|', expr: 'abs(x)' },
  { label: 'x²-4', expr: 'x^2-4' },
  { label: 'sin(x)/x', expr: 'sin(x)/x' },
]

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'math', label: 'Matematika', icon: <IconMath size={15} /> },
  { key: 'physics', label: 'Fizika', icon: <IconAtom size={15} /> },
  { key: 'chemistry', label: 'Kimyo', icon: <IconFlask size={15} /> },
  { key: 'symbols', label: 'Belgilar', icon: <IconNumbers size={15} /> },
  { key: 'greek', label: 'Grek', icon: <IconLetterA size={15} /> },
  { key: 'graph', label: 'Grafiklar', icon: <IconChartLine size={15} /> },
]

export default function FormulaDialog({ open, onClose, onInsert, onInsertImage, initialLatex = '' }: FormulaDialogProps) {
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

  // Graph state
  const [graphFns, setGraphFns] = useState<GraphFunction[]>([
    { expr: '', color: GRAPH_COLORS[0] },
  ])
  const [xRange, setXRange] = useState({ min: -10, max: 10 })
  const [yRange, setYRange] = useState({ min: -10, max: 10 })
  const [autoY, setAutoY] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const graphCanvasRef = useRef<HTMLCanvasElement>(null)

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

  // Graph canvas drawing
  useEffect(() => {
    const canvas = graphCanvasRef.current
    if (!canvas || tab !== 'graph') return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    let yMin = yRange.min, yMax = yRange.max
    if (autoY && graphFns.some(f => f.expr.trim())) {
      const auto = computeAutoYRange(graphFns, xRange.min, xRange.max)
      yMin = auto.min
      yMax = auto.max
    }

    drawGraph(ctx, rect.width, rect.height, graphFns, xRange.min, xRange.max, yMin, yMax, showGrid)
  }, [tab, graphFns, xRange, yRange, autoY, showGrid, drawerWidth])

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex.trim())
      setLatex('')
      onClose()
    }
  }

  const handleInsertGraph = useCallback(() => {
    if (!onInsertImage) return
    const exportW = 800, exportH = 500, dpr = 2
    const c = document.createElement('canvas')
    c.width = exportW * dpr
    c.height = exportH * dpr
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    let yMin = yRange.min, yMax = yRange.max
    if (autoY && graphFns.some(f => f.expr.trim())) {
      const auto = computeAutoYRange(graphFns, xRange.min, xRange.max)
      yMin = auto.min
      yMax = auto.max
    }

    drawGraph(ctx, exportW, exportH, graphFns, xRange.min, xRange.max, yMin, yMax, showGrid)
    onInsertImage(c.toDataURL('image/png'))
    onClose()
  }, [graphFns, xRange, yRange, autoY, showGrid, onInsertImage, onClose])

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

  const addGraphFn = () => {
    if (graphFns.length >= GRAPH_COLORS.length) return
    setGraphFns(prev => [...prev, { expr: '', color: GRAPH_COLORS[prev.length % GRAPH_COLORS.length] }])
  }

  const removeGraphFn = (idx: number) => {
    if (graphFns.length <= 1) return
    setGraphFns(prev => prev.filter((_, i) => i !== idx))
  }

  const updateGraphFnExpr = (idx: number, expr: string) => {
    setGraphFns(prev => prev.map((f, i) => i === idx ? { ...f, expr } : f))
  }

  const hasValidGraphFn = graphFns.some(f => f.expr.trim())

  return (
    <>
      <div className={`fd-overlay ${open ? 'fd-overlay--open' : ''}`} onClick={onClose} />
      <div ref={drawerRef} className={`fd-drawer ${open ? 'fd-drawer--open' : ''}`} style={window.innerWidth > 480 ? { width: drawerWidth } : undefined}>
        <div className="fd-resize-handle" onMouseDown={handleResizeStart} />
        <div className="fd-header">
          <div className="fd-header__title">
            {tab === 'graph' ? <IconChartLine size={20} /> : <IconMath size={20} />}
            <span>{tab === 'graph' ? 'Grafik qo\'shish' : 'Formula qo\'shish'}</span>
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
          {tab === 'graph' ? (
            <>
              {/* Function inputs */}
              <div className="fd-section-label">Funksiyalar</div>
              <div className="fd-graph-fns">
                {graphFns.map((fn, i) => (
                  <div key={i} className="fd-graph-fn-row">
                    <div className="fd-graph-fn-color" style={{ background: fn.color }} />
                    <span className="fd-graph-fn-label">y =</span>
                    <input
                      className="fd-graph-fn-input"
                      value={fn.expr}
                      onChange={e => updateGraphFnExpr(i, e.target.value)}
                      placeholder="sin(x), x^2, ..."
                      spellCheck={false}
                    />
                    {graphFns.length > 1 && (
                      <button className="fd-graph-fn-del" onClick={() => removeGraphFn(i)} title="O'chirish">
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {graphFns.length < GRAPH_COLORS.length && (
                  <button className="fd-graph-add-btn" onClick={addGraphFn}>
                    <IconPlus size={14} />
                    <span>Funksiya qo'shish</span>
                  </button>
                )}
              </div>

              {/* Presets */}
              <div className="fd-section-label">Tayyor funksiyalar</div>
              <div className="fd-quick-symbols">
                {GRAPH_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    className="fd-quick-btn"
                    onClick={() => {
                      const emptyIdx = graphFns.findIndex(f => !f.expr.trim())
                      if (emptyIdx >= 0) {
                        updateGraphFnExpr(emptyIdx, p.expr)
                      } else if (graphFns.length < GRAPH_COLORS.length) {
                        setGraphFns(prev => [...prev, { expr: p.expr, color: GRAPH_COLORS[prev.length % GRAPH_COLORS.length] }])
                      } else {
                        updateGraphFnExpr(0, p.expr)
                      }
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Range controls */}
              <div className="fd-section-label">Oraliqlar</div>
              <div className="fd-graph-ranges">
                <div className="fd-graph-range-row">
                  <span className="fd-graph-range-label">X:</span>
                  <input
                    type="number"
                    className="fd-graph-range-input"
                    value={xRange.min}
                    onChange={e => setXRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  />
                  <span className="fd-graph-range-sep">dan</span>
                  <input
                    type="number"
                    className="fd-graph-range-input"
                    value={xRange.max}
                    onChange={e => setXRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  />
                  <span className="fd-graph-range-sep">gacha</span>
                </div>
                {!autoY && (
                  <div className="fd-graph-range-row">
                    <span className="fd-graph-range-label">Y:</span>
                    <input
                      type="number"
                      className="fd-graph-range-input"
                      value={yRange.min}
                      onChange={e => setYRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                    />
                    <span className="fd-graph-range-sep">dan</span>
                    <input
                      type="number"
                      className="fd-graph-range-input"
                      value={yRange.max}
                      onChange={e => setYRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                    />
                    <span className="fd-graph-range-sep">gacha</span>
                  </div>
                )}
                <div className="fd-graph-toggles">
                  <label className="fd-graph-toggle">
                    <input type="checkbox" checked={autoY} onChange={e => setAutoY(e.target.checked)} />
                    <span>Avto Y oraliq</span>
                  </label>
                  <label className="fd-graph-toggle">
                    <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
                    <span>To'r ko'rsatish</span>
                  </label>
                </div>
              </div>

              {/* Canvas preview */}
              <div className="fd-section-label">Ko'rinishi</div>
              <div className="fd-graph-canvas-wrap">
                <canvas ref={graphCanvasRef} className="fd-graph-canvas" />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="fd-footer">
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          {tab === 'graph' ? (
            <Button onClick={handleInsertGraph} disabled={!hasValidGraphFn}>
              Qo'shish
            </Button>
          ) : (
            <Button onClick={handleInsert} disabled={!latex.trim()}>
              Qo'shish
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
