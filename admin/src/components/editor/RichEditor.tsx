import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { useRef, useState, useCallback } from 'react'
import {
  IconBold, IconItalic, IconUnderline, IconSubscript, IconSuperscript,
  IconList, IconListNumbers, IconAlignLeft, IconAlignCenter,
  IconMath, IconPhoto, IconEraser, IconArrowBack, IconArrowForward,
} from '@tabler/icons-react'
import { MathNode, MathBlock } from './MathExtension'
import { ResizableImage } from './ResizableImage'
import FormulaDialog from './FormulaDialog'

interface RichEditorProps {
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichEditor({ label, value, onChange, placeholder = 'Matn kiriting...', minHeight = 120 }: RichEditorProps) {
  const [showFormula, setShowFormula] = useState(false)
  const [editingLatex, setEditingLatex] = useState('')
  const editingPos = useRef<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      ResizableImage,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      MathNode,
      MathBlock,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await fetch('/api/topics/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        editor.chain().focus().setResizableImage({ src: data.url, width: 300 }).run()
      }
    } catch {
      const reader = new FileReader()
      reader.onload = () => {
        editor.chain().focus().setResizableImage({ src: reader.result as string, width: 300 }).run()
      }
      reader.readAsDataURL(file)
    }
  }, [editor])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleImageUpload(file)
        return
      }
    }
  }, [handleImageUpload])

  const handleMathClick = useCallback((e: React.MouseEvent) => {
    if (!editor) return
    const target = (e.target as HTMLElement).closest('.math-node, .math-block-node') as HTMLElement | null
    if (!target) return

    const latex = target.getAttribute('data-latex') || ''
    if (!latex) return

    const pos = editor.view.posAtDOM(target, 0)
    if (pos == null) return

    editingPos.current = pos
    setEditingLatex(latex)
    setShowFormula(true)
  }, [editor])

  const handleFormulaInsert = useCallback((latex: string) => {
    if (!editor) return
    if (editingPos.current != null) {
      const pos = editingPos.current
      const node = editor.state.doc.nodeAt(pos)
      if (node && (node.type.name === 'math' || node.type.name === 'mathBlock')) {
        editor.chain().focus()
          .setNodeSelection(pos)
          .deleteSelection()
          .insertContent({ type: node.type.name, attrs: { latex } })
          .run()
      } else {
        editor.chain().focus().insertMath(latex).run()
      }
      editingPos.current = null
    } else {
      editor.chain().focus().insertMath(latex).run()
    }
  }, [editor])

  if (!editor) return null

  const ToolBtn = ({ active, onClick, children, title }: {
    active?: boolean; onClick: () => void; children: React.ReactNode; title: string
  }) => (
    <button
      type="button"
      className={`re-toolbar__btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="re-toolbar__divider" />

  return (
    <div className="re-wrap">
      {label && <label className="re-label">{label}</label>}
      <div className="re-editor">
        <div className="re-toolbar">
          <ToolBtn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
            <IconArrowBack size={16} />
          </ToolBtn>
          <ToolBtn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
            <IconArrowForward size={16} />
          </ToolBtn>

          <Divider />

          <ToolBtn title="Qalin (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <IconBold size={16} />
          </ToolBtn>
          <ToolBtn title="Kursiv (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <IconItalic size={16} />
          </ToolBtn>
          <ToolBtn title="Tag chiziq (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <IconUnderline size={16} />
          </ToolBtn>

          <Divider />

          <ToolBtn title="Pastki indeks (H₂O)" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
            <IconSubscript size={16} />
          </ToolBtn>
          <ToolBtn title="Ustki indeks (x²)" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            <IconSuperscript size={16} />
          </ToolBtn>

          <Divider />

          <ToolBtn title="Ro'yxat" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <IconList size={16} />
          </ToolBtn>
          <ToolBtn title="Raqamli ro'yxat" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <IconListNumbers size={16} />
          </ToolBtn>

          <Divider />

          <ToolBtn title="Chapga" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <IconAlignLeft size={16} />
          </ToolBtn>
          <ToolBtn title="Markazga" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <IconAlignCenter size={16} />
          </ToolBtn>

          <Divider />

          <ToolBtn title="Formula qo'shish" onClick={() => { editingPos.current = null; setEditingLatex(''); setShowFormula(true) }}>
            <IconMath size={16} />
          </ToolBtn>
          <ToolBtn title="Rasm qo'shish" onClick={() => fileRef.current?.click()}>
            <IconPhoto size={16} />
          </ToolBtn>

          <Divider />

          <ToolBtn title="Formatlashni tozalash" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <IconEraser size={16} />
          </ToolBtn>
        </div>

        <div
          className="re-content"
          style={{ minHeight }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onPaste={handlePaste}
          onClick={handleMathClick}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />

      <FormulaDialog
        open={showFormula}
        onClose={() => { setShowFormula(false); editingPos.current = null; setEditingLatex('') }}
        onInsert={handleFormulaInsert}
        initialLatex={editingLatex}
      />
    </div>
  )
}
