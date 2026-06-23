import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  IconArrowLeft, IconDeviceFloppy, IconPlus, IconCheck,
  IconSparkles, IconWand, IconRefresh, IconBulb, IconMath,
} from '@tabler/icons-react'
import api from '../../api'
import { PageHeader, Button, Card, CardBody } from '../../components/ui'
import { RichEditor } from '../../components/editor'

interface TopicInfo { id: number; name: string }
interface SubjectInfo { id: number; name: string }

const EMPTY = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
}

export default function QuestionForm() {
  const { subjectId, topicId, questionId } = useParams()
  const navigate = useNavigate()
  const sid = Number(subjectId)
  const tid = Number(topicId)
  const qid = questionId ? Number(questionId) : null
  const isEdit = !!qid

  const [subject, setSubject] = useState<SubjectInfo | null>(null)
  const [topic, setTopic] = useState<TopicInfo | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/subjects/${sid}`).then(r => setSubject(r.data)).catch(() => {})
    api.get(`/topics/${tid}`).then(r => {
      setTopic(r.data)
      if (isEdit) {
        const q = r.data.questions?.find((q: { id: number }) => q.id === qid)
        if (q) {
          setForm({
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
          })
        }
      }
      setLoaded(true)
    })
  }, [tid, qid, isEdit])

  const callAi = async (action: string, text: string, context?: string) => {
    setAiLoading(action)
    try {
      const res = await api.post('/ai/assist', { action, text, context: context || '' })
      return res.data.result as string
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'AI xatolik berdi'
      toast.error(msg)
      return null
    } finally {
      setAiLoading(null)
    }
  }

  const updateForm = (newForm: typeof form) => {
    setForm(newForm)
    setLoaded(false)
    setTimeout(() => setLoaded(true), 30)
  }

  const handleAiRewrite = async () => {
    if (!form.question_text.trim()) { toast.error('Avval savol yozing'); return }
    const result = await callAi('rewrite', form.question_text.replace(/<[^>]+>/g, ''))
    if (result) updateForm({ ...form, question_text: result })
  }

  const handleAiImprove = async () => {
    if (!form.question_text.trim()) { toast.error('Avval savol yozing'); return }
    const result = await callAi('improve', form.question_text.replace(/<[^>]+>/g, ''))
    if (result) updateForm({ ...form, question_text: result })
  }

  const handleAiContinue = async () => {
    if (!form.question_text.trim()) { toast.error('Avval savol yozing'); return }
    const result = await callAi('continue', form.question_text.replace(/<[^>]+>/g, ''))
    if (result) updateForm({ ...form, question_text: form.question_text + ' ' + result })
  }

  const handleAiLatex = async (field: keyof typeof form) => {
    const text = form[field]
    if (!text.trim()) return
    const plain = text.replace(/<[^>]+>/g, '')
    const result = await callAi('latex', plain)
    if (!result) return
    const html = result
      .replace(/<span[^>]*data-latex="([^"]*)"[^>]*>([^<]*)<\/span>/g,
        (_: string, latex: string) => `<span data-math="" data-latex="${latex}"></span>`)
      .replace(/\n/g, '<br>')
    updateForm({ ...form, [field]: html })
  }

  const handleAiGenerateOptions = async () => {
    if (!form.question_text.trim()) { toast.error('Avval savol yozing'); return }
    const result = await callAi('generate_options', form.question_text.replace(/<[^>]+>/g, ''))
    if (!result) return

    const lines = result.split('\n').filter(l => l.trim())
    let a = '', b = '', c = '', d = '', correct = 'A'
    for (const line of lines) {
      const trimmed = line.trim()
      if (/^A\)/.test(trimmed)) a = trimmed.replace(/^A\)\s*/, '')
      else if (/^B\)/.test(trimmed)) b = trimmed.replace(/^B\)\s*/, '')
      else if (/^C\)/.test(trimmed)) c = trimmed.replace(/^C\)\s*/, '')
      else if (/^D\)/.test(trimmed)) d = trimmed.replace(/^D\)\s*/, '')
      else if (/to['']?g['']?ri/i.test(trimmed)) {
        const match = trimmed.match(/[ABCD]/)
        if (match) correct = match[0]
      }
    }
    if (a && b && c && d) {
      updateForm({ ...form, option_a: a, option_b: b, option_c: c, option_d: d, correct_option: correct })
      toast.success('Variantlar yaratildi')
    } else {
      toast.error('Variantlarni ajratib bo\'lmadi')
    }
  }

  const handleAiGenerateQuestion = async () => {
    const ctx = [subject?.name, topic?.name].filter(Boolean).join(' — ')
    const result = await callAi('generate_question', '', ctx || 'Umumiy')
    if (!result) return

    const lines = result.split('\n').filter(l => l.trim())
    let qText = '', a = '', b = '', c = '', d = '', correct = 'A'
    for (const line of lines) {
      const trimmed = line.trim()
      if (/^savol:/i.test(trimmed)) qText = trimmed.replace(/^savol:\s*/i, '')
      else if (/^A\)/.test(trimmed)) a = trimmed.replace(/^A\)\s*/, '')
      else if (/^B\)/.test(trimmed)) b = trimmed.replace(/^B\)\s*/, '')
      else if (/^C\)/.test(trimmed)) c = trimmed.replace(/^C\)\s*/, '')
      else if (/^D\)/.test(trimmed)) d = trimmed.replace(/^D\)\s*/, '')
      else if (/to['']?g['']?ri/i.test(trimmed)) {
        const match = trimmed.match(/[ABCD]/)
        if (match) correct = match[0]
      }
    }
    if (qText) {
      updateForm({ question_text: qText, option_a: a, option_b: b, option_c: c, option_d: d, correct_option: correct })
      toast.success('Savol yaratildi')
    } else {
      toast.error('Savolni ajratib bo\'lmadi')
    }
  }

  const handleSave = async () => {
    if (!form.question_text.trim() || !form.option_a.trim() || !form.option_b.trim() ||
        !form.option_c.trim() || !form.option_d.trim()) {
      toast.error('Barcha maydonlarni to\'ldiring')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/topics/questions/${qid}`, form)
        toast.success('Savol yangilandi')
      } else {
        await api.post(`/topics/${tid}/questions`, form)
        toast.success("Savol qo'shildi")
      }
      navigate(`/tests/${sid}/${tid}`)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndNew = async () => {
    if (!form.question_text.trim() || !form.option_a.trim() || !form.option_b.trim() ||
        !form.option_c.trim() || !form.option_d.trim()) {
      toast.error('Barcha maydonlarni to\'ldiring')
      return
    }
    setSaving(true)
    try {
      await api.post(`/topics/${tid}/questions`, form)
      toast.success("Savol qo'shildi")
      setForm({ ...EMPTY })
      setLoaded(false)
      setTimeout(() => setLoaded(true), 50)
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const options = [
    { key: 'A', field: 'option_a' as const },
    { key: 'B', field: 'option_b' as const },
    { key: 'C', field: 'option_c' as const },
    { key: 'D', field: 'option_d' as const },
  ]

  if (!loaded) return <div className="ui-empty"><p>Yuklanmoqda...</p></div>

  return (
    <div className="qf-page">
      <PageHeader
        icon={<IconDeviceFloppy size={22} />}
        iconColor="var(--primary)"
        iconBg="var(--primary-50)"
        title={isEdit ? 'Savolni tahrirlash' : 'Yangi savol'}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tests/${sid}/${tid}`)}>
            <IconArrowLeft size={16} /> {topic?.name || 'Orqaga'}
          </Button>
        }
      />

      {/* AI Tools */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={handleAiGenerateQuestion} disabled={!!aiLoading}>
          <IconSparkles size={15} style={{ color: 'var(--secondary)' }} />
          {aiLoading === 'generate_question' ? 'Yaratilmoqda...' : 'AI: Savol yaratish'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleAiRewrite} disabled={!!aiLoading}>
          <IconRefresh size={15} style={{ color: 'var(--info)' }} />
          {aiLoading === 'rewrite' ? 'Yozilmoqda...' : 'AI: Qayta yozish'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleAiImprove} disabled={!!aiLoading}>
          <IconBulb size={15} style={{ color: 'var(--success)' }} />
          {aiLoading === 'improve' ? 'Yaxshilanmoqda...' : 'AI: Yaxshilash'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleAiContinue} disabled={!!aiLoading}>
          <IconWand size={15} style={{ color: 'var(--primary)' }} />
          {aiLoading === 'continue' ? 'Davom etmoqda...' : 'AI: Davom ettirish'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleAiGenerateOptions} disabled={!!aiLoading}>
          <IconSparkles size={15} style={{ color: 'var(--warning)' }} />
          {aiLoading === 'generate_options' ? 'Yaratilmoqda...' : 'AI: Variantlar yaratish'}
        </Button>
      </div>

      {/* Savol matni */}
      <Card>
        <div className="qf-section-header">
          <div className="qf-section-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>?</div>
          <div>
            <h3>Savol matni</h3>
            <p>Formulalar, rasmlar va formatlash qo'shishingiz mumkin</p>
          </div>
        </div>
        <CardBody>
          <RichEditor
            value={form.question_text}
            onChange={v => setForm({ ...form, question_text: v })}
            placeholder="Savolni yozing... Formulalar uchun toolbar'dagi f(x) tugmasini bosing"
            minHeight={140}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button
              type="button"
              onClick={() => handleAiLatex('question_text')}
              disabled={!!aiLoading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', fontSize: 12, fontWeight: 600,
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--primary)', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              <IconMath size={14} />
              {aiLoading === 'latex' ? 'Formatlanmoqda...' : 'LaTeX formatlash'}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Variantlar */}
      <Card>
        <div className="qf-section-header">
          <div className="qf-section-icon" style={{ background: 'var(--info-50)', color: 'var(--info)' }}>
            <IconCheck size={16} />
          </div>
          <div>
            <h3>Javob variantlari</h3>
            <p>To'g'ri javobni tanlash uchun variant harfini bosing</p>
          </div>
        </div>
        <CardBody>
          <div className="qf-options">
            {options.map(opt => {
              const isCorrect = form.correct_option === opt.key
              return (
                <div key={opt.key} className={`qf-option ${isCorrect ? 'qf-option--correct' : ''}`}>
                  <button
                    type="button"
                    className={`qf-option__letter ${isCorrect ? 'qf-option__letter--correct' : ''}`}
                    onClick={() => setForm({ ...form, correct_option: opt.key })}
                    title={isCorrect ? "To'g'ri javob" : "To'g'ri deb belgilash"}
                  >
                    {isCorrect ? <IconCheck size={18} /> : opt.key}
                  </button>
                  <div className="qf-option__editor">
                    <RichEditor
                      value={form[opt.field]}
                      onChange={v => setForm({ ...form, [opt.field]: v })}
                      placeholder={`${opt.key} variant...`}
                      minHeight={60}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleAiLatex(opt.field)}
                        disabled={!!aiLoading}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '2px 8px', fontSize: 11, fontWeight: 600,
                          background: 'none', border: '1px solid var(--border)',
                          borderRadius: 5, color: 'var(--primary)', cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                      >
                        <IconMath size={12} /> LaTeX
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Footer */}
      <div className="qf-footer">
        <Button variant="ghost" onClick={() => navigate(`/tests/${sid}/${tid}`)}>
          Bekor qilish
        </Button>
        <div className="qf-footer__right">
          {!isEdit && (
            <Button variant="ghost" onClick={handleSaveAndNew} disabled={saving}>
              <IconPlus size={16} /> Saqlash va yangi qo'shish
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <IconDeviceFloppy size={16} /> {isEdit ? 'Saqlash' : "Qo'shish"}
          </Button>
        </div>
      </div>
    </div>
  )
}
