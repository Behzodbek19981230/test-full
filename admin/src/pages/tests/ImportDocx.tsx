import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  IconFileImport, IconArrowLeft, IconUpload, IconCheck,
  IconAlertCircle, IconTrash, IconDownload,
} from '@tabler/icons-react'
import api from '../../api'
import { PageHeader, Button, Badge, Card, CardBody } from '../../components/ui'

interface ParsedQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

export default function ImportDocx() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const sid = Number(subjectId)
  const tid = Number(topicId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [error, setError] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setQuestions([])
      setError('')
    }
  }

  const handleParse = async () => {
    if (!file) return
    setParsing(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/topics/${tid}/import-docx`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setQuestions(res.data.questions)
      if (res.data.questions.length === 0) {
        setError("Fayldan savollar topilmadi. Shablon formatini tekshiring.")
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Faylni o'qishda xatolik")
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    if (questions.length === 0) return
    setSaving(true)
    try {
      await api.post(`/topics/${tid}/import-docx/save`, { questions })
      toast.success(`${questions.length} ta savol import qilindi!`)
      navigate(`/tests/${sid}/${tid}`)
    } catch {
      toast.error('Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const updateCorrect = (idx: number, letter: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, correct_option: letter } : q))
  }

  const optionLabels = ['A', 'B', 'C', 'D'] as const
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'] as const

  return (
    <div className="qf-page">
      <PageHeader
        icon={<IconFileImport size={22} />}
        iconColor="var(--info)"
        iconBg="var(--info-50)"
        title="Word'dan import"
        actions={<>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tests/${sid}/${tid}`)}>
            <IconArrowLeft size={16} /> Orqaga
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const link = document.createElement('a')
            link.href = '/api/topics/import-template'
            link.download = 'test_shablon.docx'
            link.click()
          }}>
            <IconDownload size={16} /> Shablonni yuklab olish
          </Button>
        </>}
      />

      {/* Shablon haqida ma'lumot */}
      <Card>
        <div className="qf-section-header">
          <div className="qf-section-icon" style={{ background: 'var(--info-50)', color: 'var(--info)' }}>
            <IconDownload size={16} />
          </div>
          <div>
            <h3>Shablon formati</h3>
            <p>Word faylingizda testlarni quyidagi formatda yozing</p>
          </div>
        </div>
        <CardBody>
          <div className="import-template">
            <pre>{`1. Savol matni bu yerda (formula va rasm ham bo'lishi mumkin)
A) Birinchi variant
B) Ikkinchi variant
C) Uchinchi variant
D) To'rtinchi variant
Javob: A

2. Keyingi savol matni
A) Variant A
*B) To'g'ri javob (yulduzcha bilan belgilash ham mumkin)
C) Variant C
D) Variant D

3. Yana bir savol...`}</pre>
            <div className="import-template__hints">
              <div className="import-template__hint">
                <Badge variant="info">Savol</Badge>
                <span>Raqam + nuqta/qavs bilan boshlang: <code>1.</code> yoki <code>1)</code></span>
              </div>
              <div className="import-template__hint">
                <Badge variant="purple">Variant</Badge>
                <span>Harf + qavs: <code>A)</code> <code>B)</code> <code>C)</code> <code>D)</code></span>
              </div>
              <div className="import-template__hint">
                <Badge variant="success">To'g'ri javob</Badge>
                <span><code>Javob: A</code> yoki <code>*A)</code> / <code>+A)</code> bilan belgilang</span>
              </div>
              <div className="import-template__hint">
                <Badge variant="warning">Formula</Badge>
                <span>Word'ning Insert → Equation orqali formula qo'shing</span>
              </div>
              <div className="import-template__hint">
                <Badge variant="danger">Rasm</Badge>
                <span>Rasmlarni Word'ga oddiy qo'shing — avtomatik chiqariladi</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Fayl tanlash */}
      <Card>
        <CardBody>
          <div className="import-upload">
            <input ref={fileRef} type="file" accept=".docx" hidden onChange={handleFileSelect} />

            {!file ? (
              <button className="import-dropzone" onClick={() => fileRef.current?.click()}>
                <IconUpload size={32} />
                <span className="import-dropzone__title">Word faylni tanlang</span>
                <span className="import-dropzone__hint">Faqat .docx format qabul qilinadi</span>
              </button>
            ) : (
              <div className="import-file-info">
                <div className="import-file-info__icon">
                  <IconFileImport size={24} />
                </div>
                <div className="import-file-info__details">
                  <div className="import-file-info__name">{file.name}</div>
                  <div className="import-file-info__size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
                <div className="import-file-info__actions">
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setQuestions([]); setError('') }}>
                    O'zgartirish
                  </Button>
                  <Button onClick={handleParse} disabled={parsing}>
                    {parsing ? 'Tahlil qilinmoqda...' : 'Tahlil qilish'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="import-error">
              <IconAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Natijalar */}
      {questions.length > 0 && (
        <>
          <div className="import-results-header">
            <h3><IconCheck size={18} /> {questions.length} ta savol topildi</h3>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : `Barchasini saqlash (${questions.length})`}
            </Button>
          </div>

          <div className="question-list">
            {questions.map((q, idx) => (
              <div key={idx} className="q-card">
                <div className="q-card__header">
                  <div className="q-card__number">{idx + 1}-savol</div>
                  <div className="q-card__actions">
                    <Button variant="ghost" size="icon-sm" onClick={() => removeQuestion(idx)} style={{ color: 'var(--danger)' }}>
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </div>

                <div className="q-card__body">
                  <div className="q-card__text" dangerouslySetInnerHTML={{ __html: q.question_text || '<em style="color:var(--text-600)">Bo\'sh savol</em>' }} />

                  <div className="q-card__options">
                    {optionLabels.map((label, i) => {
                      const isCorrect = q.correct_option === label
                      return (
                        <div
                          key={label}
                          className={`q-card__option ${isCorrect ? 'q-card__option--correct' : ''}`}
                          onClick={() => updateCorrect(idx, label)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={`q-card__option-letter ${isCorrect ? 'q-card__option-letter--correct' : ''}`}>
                            {isCorrect ? <IconCheck size={14} /> : label}
                          </div>
                          <div className="q-card__option-text" dangerouslySetInnerHTML={{ __html: q[optionKeys[i]] || '—' }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="qf-footer">
            <Button variant="ghost" onClick={() => setQuestions([])}>Bekor qilish</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : `${questions.length} ta savolni saqlash`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
