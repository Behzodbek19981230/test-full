import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  IconArrowLeft, IconDeviceFloppy, IconPlus, IconCheck,
} from '@tabler/icons-react'
import api from '../../api'
import { PageHeader, Button, Card, CardBody } from '../../components/ui'
import { RichEditor } from '../../components/editor'

interface TopicInfo { id: number; name: string }

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

  const [topic, setTopic] = useState<TopicInfo | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
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
