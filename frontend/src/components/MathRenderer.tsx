'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

function renderMath(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>('[data-latex]').forEach(el => {
    const latex = el.getAttribute('data-latex')
    if (latex) {
      try {
        katex.render(latex, el, { throwOnError: false })
      } catch { /* skip */ }
    }
  })
}

export default function MathHTML({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = html
    renderMath(ref.current)
  }, [html])

  return <span ref={ref} className={className} />
}
