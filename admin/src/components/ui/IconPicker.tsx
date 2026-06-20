import { useState, useRef } from 'react'
import { IconUpload, IconCode, IconMoodSmile, IconX, IconCheck, IconPhoto } from '@tabler/icons-react'
import Button from './Button'

type Tab = 'emoji' | 'svg' | 'upload'

interface IconPickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
}

const SUBJECT_EMOJIS = [
  '📐', '📏', '🔢', '➕', '📊', '📈',
  '🧪', '⚗️', '🔬', '🧬', '💊', '🩺',
  '🌍', '🗺️', '🌐', '🏔️', '🌿', '🌎',
  '📖', '📚', '✏️', '📝', '🖊️', '📕',
  '🇬🇧', '🇺🇿', '🇷🇺', '🇩🇪', '🇫🇷', '🇯🇵',
  '💻', '🖥️', '⌨️', '🤖', '📱', '🔧',
  '🎵', '🎨', '🎭', '🎬', '📷', '🎹',
  '⚽', '🏀', '🏃', '🏋️', '🎯', '🏅',
  '🏛️', '⚖️', '📜', '🗳️', '💰', '🏦',
  '🧠', '💡', '🎓', '🏫', '📌', '🔑',
]

export default function IconPicker({ label, value, onChange }: IconPickerProps) {
  const [tab, setTab] = useState<Tab>('emoji')
  const [svgCode, setSvgCode] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isUploadedFile = value.startsWith('/api/uploads/') || value.startsWith('data:')
  const isSvg = value.startsWith('<svg')
  const isEmoji = !isUploadedFile && !isSvg

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 512 * 1024
    if (file.size > maxSize) {
      alert('Fayl hajmi 512KB dan oshmasin')
      return
    }

    if (file.type === 'image/svg+xml') {
      const text = await file.text()
      onChange(text)
      setPreview(null)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('icon', file)

    try {
      const res = await fetch('/api/subjects/upload-icon', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        onChange(data.url)
        setPreview(data.url)
      }
    } catch {
      alert('Yuklashda xatolik')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const applySvg = () => {
    const trimmed = svgCode.trim()
    if (!trimmed.startsWith('<svg')) {
      alert('SVG kod <svg bilan boshlanishi kerak')
      return
    }
    onChange(trimmed)
    setSvgCode('')
  }

  const renderPreview = () => {
    if (!value) return <div className="ip-preview-empty"><IconPhoto size={28} /></div>

    if (isSvg) {
      return <div className="ip-preview-svg" dangerouslySetInnerHTML={{ __html: value }} />
    }

    if (isUploadedFile) {
      return <img src={value} alt="icon" className="ip-preview-img" />
    }

    return <span className="ip-preview-emoji">{value}</span>
  }

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: 'emoji', icon: <IconMoodSmile size={15} />, label: 'Emoji' },
    { key: 'svg', icon: <IconCode size={15} />, label: 'SVG Kod' },
    { key: 'upload', icon: <IconUpload size={15} />, label: 'Fayl' },
  ]

  return (
    <div className="ui-field">
      {label && <label className="ui-label">{label}</label>}

      <div className="ip-container">
        <div className="ip-top">
          <div className="ip-preview">
            {renderPreview()}
          </div>

          <div className="ip-meta">
            <div className="ip-type">
              {isEmoji && 'Emoji'}
              {isSvg && 'SVG'}
              {isUploadedFile && 'Rasm'}
              {!value && 'Tanlanmagan'}
            </div>
            {value && (
              <button type="button" className="ip-clear" onClick={() => { onChange('📚'); setPreview(null) }}>
                <IconX size={14} /> Tozalash
              </button>
            )}
          </div>
        </div>

        <div className="ip-tabs">
          {tabs.map(t => (
            <button key={t.key} type="button"
              className={`ip-tab ${tab === t.key ? 'ip-tab--active' : ''}`}
              onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="ip-body">
          {tab === 'emoji' && (
            <div className="ip-emoji-grid">
              {SUBJECT_EMOJIS.map((em, i) => (
                <button key={i} type="button"
                  className={`ip-emoji ${value === em ? 'ip-emoji--active' : ''}`}
                  onClick={() => onChange(em)}>
                  {em}
                </button>
              ))}
            </div>
          )}

          {tab === 'svg' && (
            <div className="ip-svg-input">
              <textarea
                className="ui-input ui-textarea"
                placeholder={'<svg viewBox="0 0 24 24" ...>\n  <path d="..." />\n</svg>'}
                value={svgCode}
                onChange={e => setSvgCode(e.target.value)}
                style={{ minHeight: 90, fontFamily: 'monospace', fontSize: 12 }}
              />
              <Button variant="primary" size="sm" type="button" onClick={applySvg} disabled={!svgCode.trim()}>
                <IconCheck size={15} /> Qo'llash
              </Button>
            </div>
          )}

          {tab === 'upload' && (
            <div className="ip-upload-zone">
              <input ref={fileRef} type="file" accept=".svg,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect} style={{ display: 'none' }} />
              <button type="button" className="ip-dropzone" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <IconUpload size={24} />
                <span>{uploading ? 'Yuklanmoqda...' : 'SVG, PNG, JPG yuklash'}</span>
                <span className="ip-dropzone-hint">Max 512KB</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
