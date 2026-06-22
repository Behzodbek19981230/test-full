'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    katex?: {
      render: (latex: string, el: HTMLElement, opts?: Record<string, unknown>) => void
    }
  }
}

let katexLoaded = false
let katexLoading = false
const callbacks: (() => void)[] = []

function loadKatex(cb: () => void) {
  if (katexLoaded) { cb(); return }
  callbacks.push(cb)
  if (katexLoading) return
  katexLoading = true
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
  script.crossOrigin = 'anonymous'
  script.onload = () => {
    katexLoaded = true
    callbacks.forEach(fn => fn())
    callbacks.length = 0
  }
  document.head.appendChild(script)
}

function renderMath(container: HTMLElement) {
  const nodes = container.querySelectorAll('[data-latex]')
  nodes.forEach(el => {
    const latex = el.getAttribute('data-latex')
    if (latex && window.katex) {
      try {
        window.katex.render(latex, el as HTMLElement, { throwOnError: false })
      } catch { /* skip */ }
    }
  })
}

export function useMathRender(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    loadKatex(() => renderMath(el))
  }, deps)

  return ref
}

export default function MathHTML({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    loadKatex(() => renderMath(el))
  }, [html])

  return <span ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
