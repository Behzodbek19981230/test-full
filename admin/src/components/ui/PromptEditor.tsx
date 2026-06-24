import { useRef, useEffect, useCallback } from 'react'

interface PromptEditorProps {
  placeholder?: string
  onCtrlEnter?: () => void
  getText: React.MutableRefObject<() => { text: string; image: string | null }>
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

export default function PromptEditor({ placeholder, onCtrlEnter, getText }: PromptEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  const extract = useCallback(() => {
    const el = ref.current
    if (!el) return { text: '', image: null }

    let image: string | null = null
    const img = el.querySelector('img')
    if (img?.src) image = img.src

    const clone = el.cloneNode(true) as HTMLElement
    clone.querySelectorAll('img').forEach(i => i.remove())
    const text = clone.innerText.trim()

    return { text, image }
  }, [])

  useEffect(() => {
    getText.current = extract
  }, [extract, getText])

  const insertImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) return
    const b64 = await fileToBase64(file)
    const el = ref.current
    if (!el) return

    el.querySelectorAll('img').forEach(i => i.remove())

    const img = document.createElement('img')
    img.src = b64
    img.style.maxWidth = '100%'
    img.style.maxHeight = '200px'
    img.style.borderRadius = '8px'
    img.style.display = 'block'
    img.style.margin = '8px 0'
    img.style.border = '1px solid var(--border)'
    img.contentEditable = 'false'

    el.appendChild(img)
    el.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) insertImage(file)
        return
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      insertImage(file)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      onCtrlEnter?.()
    }
  }

  return (
    <div
      ref={ref}
      className="prompt-editor"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onKeyDown={handleKeyDown}
    />
  )
}
