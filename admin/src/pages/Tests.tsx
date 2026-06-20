import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconClipboardCheck, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Dialog, Input, Textarea, Select, Badge, Card, CardBody } from '../components/ui'
import Table from '../components/ui/Table'

interface Subject { id: number; name: string }
interface Question { question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string }
interface Test {
  id: number; title: string; description: string; subject_id: number; subject_name: string
  price: number; question_count: number; duration_minutes: number; is_active: boolean
}

const emptyQ = (): Question => ({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [filter, setFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Test | null>(null)
  const [form, setForm] = useState({ title: '', description: '', subject_id: 0, price: 0, duration_minutes: 60 })
  const [questions, setQuestions] = useState<Question[]>([emptyQ()])

  const load = () => {
    const params = filter ? `?subject_id=${filter}` : ''
    api.get(`/tests/all${params}`).then(r => setTests(r.data))
  }

  useEffect(() => { api.get('/subjects/all').then(r => setSubjects(r.data)); load() }, [filter])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', subject_id: subjects[0]?.id || 0, price: 0, duration_minutes: 60 })
    setQuestions([emptyQ()])
    setShowModal(true)
  }

  const openEdit = async (t: Test) => {
    const { data } = await api.get(`/tests/${t.id}/questions`)
    setEditing(t)
    setForm({ title: t.title, description: t.description || '', subject_id: t.subject_id, price: t.price, duration_minutes: t.duration_minutes })
    setQuestions(data.questions.length > 0 ? data.questions : [emptyQ()])
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/tests/${editing.id}`, { ...form, questions }); toast.success('Test yangilandi') }
      else { await api.post('/tests', { ...form, questions }); toast.success('Test yaratildi') }
      setShowModal(false); load()
    } catch { toast.error('Xatolik yuz berdi') }
  }

  const updateQ = (i: number, field: string, val: string) => {
    const u = [...questions]; (u[i] as any)[field] = val; setQuestions(u)
  }

  return (
    <div>
      <PageHeader
        icon={<IconClipboardCheck size={22} />} iconColor="var(--success)" iconBg="var(--success-50)" title="Testlar"
        actions={<>
          <Select
            options={[{ value: '', label: 'Barcha fanlar' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
            value={filter} onChange={v => setFilter(String(v))} isClearable className="mb-0"
          />
          <Button onClick={openCreate}><IconPlus size={18} /> Yangi test</Button>
        </>}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={tests}
            emptyIcon={<IconClipboardCheck size={40} />}
            emptyText="Testlar topilmadi"
            columns={[
              { key: 'title', header: 'Nomi', render: t => <span className="td-main">{t.title}</span> },
              { key: 'subject', header: 'Fan', render: t => <Badge variant="purple">{t.subject_name}</Badge> },
              { key: 'questions', header: 'Savollar', render: t => t.question_count },
              { key: 'price', header: 'Narxi', render: t => (
                <span style={{ fontWeight: 600, color: t.price > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {t.price > 0 ? `${t.price.toLocaleString()} so'm` : 'Bepul'}
                </span>
              )},
              { key: 'duration', header: 'Vaqt', render: t => `${t.duration_minutes} daq` },
              { key: 'status', header: 'Holat', render: t => <Badge variant={t.is_active ? 'success' : 'danger'}>{t.is_active ? 'Faol' : 'O\'chiq'}</Badge> },
              { key: 'actions', header: '', width: 50, render: t => (
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}><IconEdit size={16} /></Button>
              )},
            ]}
          />
        </CardBody>
      </Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Testni tahrirlash' : 'Yangi test'} size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Bekor qilish</Button>
          <Button type="submit" form="test-form">{editing ? 'Saqlash' : 'Yaratish'}</Button>
        </>}
      >
        <form id="test-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <Input label="Nomi" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <Select label="Fan" options={subjects.map(s => ({ value: s.id, label: s.name }))}
              value={form.subject_id} onChange={v => setForm({ ...form, subject_id: +v })} />
          </div>
          <div className="grid-2">
            <Input label="Narxi (so'm)" type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
            <Input label="Vaqt (daqiqa)" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })} />
          </div>
          <Textarea label="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-50)' }}>Savollar ({questions.length})</span>
              <Button variant="ghost" size="sm" type="button" onClick={() => setQuestions([...questions, emptyQ()])}><IconPlus size={15} /> Savol</Button>
            </div>

            {questions.map((q, i) => (
              <div key={i} className="ui-question">
                <div className="ui-question-header">
                  <span className="ui-question-num">Savol {i + 1}</span>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon-sm" type="button" style={{ color: 'var(--danger)' }}
                      onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}>
                      <IconTrash size={15} />
                    </Button>
                  )}
                </div>
                <Textarea placeholder="Savol matni" value={q.question_text} onChange={e => updateQ(i, 'question_text', e.target.value)} required style={{ minHeight: 50 }} />
                <div className="ui-options-grid">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <Input key={opt} placeholder={`${opt.toUpperCase()} variant`}
                      value={(q as any)[`option_${opt}`]} onChange={e => updateQ(i, `option_${opt}`, e.target.value)} required />
                  ))}
                </div>
                <Select label="To'g'ri javob" options={['A','B','C','D'].map(v => ({ value: v, label: v }))}
                  value={q.correct_option} onChange={v => updateQ(i, 'correct_option', String(v))} isSearchable={false} />
              </div>
            ))}
          </div>
        </form>
      </Dialog>
    </div>
  )
}
