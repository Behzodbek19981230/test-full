import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  IconQuestionMark, IconPlus, IconEdit, IconTrash, IconArrowLeft,
  IconCheck, IconFileImport,
} from '@tabler/icons-react'
import api from '../../api'
import { PageHeader, Button, Badge, Card, CardBody, PageLoader } from '../../components/ui'
import katex from 'katex'

interface Topic { id: number; name: string; subject_id: number }
interface Question {
  id: number; question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_option: string
}

function RenderHTML({ html }: { html: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = html
    ref.current.querySelectorAll<HTMLElement>('[data-latex]').forEach(el => {
      const latex = el.getAttribute('data-latex')
      if (latex) {
        try { katex.render(latex, el, { throwOnError: false }) } catch {}
      }
    })
  }, [html])
  return <span ref={ref} />
}

export default function TestQuestions() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const tid = Number(topicId)
  const sid = Number(subjectId)

  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/topics/${tid}`).then(r => {
      setTopic(r.data)
      setQuestions(r.data.questions)
    }).finally(() => setLoading(false))
  }, [tid])

  const deleteQ = async (q: Question) => {
    if (!confirm("Savolni o'chirishni tasdiqlaysizmi?")) return
    await api.delete(`/topics/questions/${q.id}`)
    toast.success("Savol o'chirildi")
    setQuestions(prev => prev.filter(x => x.id !== q.id))
  }

  const optionLabels = ['A', 'B', 'C', 'D'] as const
  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'] as const

  if (loading) return <PageLoader rows={5} />

  return (
    <div>
      <PageHeader
        icon={<IconQuestionMark size={22} />}
        iconColor="var(--warning)"
        iconBg="var(--warning-50)"
        title={topic?.name || 'Yuklanmoqda...'}
        badge={<Badge variant="purple">{questions.length} savol</Badge>}
        actions={<>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tests/${sid}`)}>
            <IconArrowLeft size={16} /> Mavzularga
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/tests/${sid}/${tid}/import`)}>
            <IconFileImport size={16} /> Word'dan import
          </Button>
          <Button onClick={() => navigate(`/tests/${sid}/${tid}/new`)}>
            <IconPlus size={18} /> Savol qo'shish
          </Button>
        </>}
      />

      {questions.length === 0 ? (
        <Card>
          <CardBody>
            <div className="ui-empty">
              <div className="ui-empty-icon"><IconQuestionMark size={48} /></div>
              <p>Savollar mavjud emas</p>
              <Button style={{ marginTop: 16 }} onClick={() => navigate(`/tests/${sid}/${tid}/new`)}>
                <IconPlus size={16} /> Birinchi savolni qo'shing
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="question-list">
          {questions.map((q, idx) => (
            <div key={q.id} className="q-card">
              <div className="q-card__header">
                <div className="q-card__number">{idx + 1}-savol</div>
                <div className="q-card__actions">
                  <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/tests/${sid}/${tid}/${q.id}/edit`)}>
                    <IconEdit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteQ(q)} style={{ color: 'var(--danger)' }}>
                    <IconTrash size={16} />
                  </Button>
                </div>
              </div>

              <div className="q-card__body">
                <div className="q-card__text">
                  <RenderHTML html={q.question_text} />
                </div>

                <div className="q-card__options">
                  {optionLabels.map((label, i) => {
                    const isCorrect = q.correct_option === label
                    return (
                      <div key={label} className={`q-card__option ${isCorrect ? 'q-card__option--correct' : ''}`}>
                        <div className={`q-card__option-letter ${isCorrect ? 'q-card__option-letter--correct' : ''}`}>
                          {isCorrect ? <IconCheck size={14} /> : label}
                        </div>
                        <div className="q-card__option-text">
                          <RenderHTML html={q[optionKeys[i]]} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
