import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconFolder, IconPlus, IconEdit, IconTrash, IconChevronRight, IconArrowLeft, IconQuestionMark, IconX } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Dialog, Input, Textarea, Select, Badge, Card, CardHeader, CardBody, SubjectIcon } from '../components/ui'
import Table from '../components/ui/Table'

interface Subject { id: number; name: string; icon: string; topic_count: number; question_count: number; price_per_question: number; is_active: boolean }
interface Topic { id: number; subject_id: number; name: string; description: string; question_count: number; is_active: boolean }
interface Question { id: number; topic_id: number; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string }

type View = 'subjects' | 'topics' | 'questions'

export default function Tests() {
  const [view, setView] = useState<View>('subjects')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  // Topic modal
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicForm, setTopicForm] = useState({ name: '', description: '' })

  // Question modal
  const [showQModal, setShowQModal] = useState(false)
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })

  const loadSubjects = () => api.get('/subjects/all').then(r => setSubjects(r.data))
  const loadTopics = (sid: number) => api.get(`/topics/all?subject_id=${sid}`).then(r => setTopics(r.data))
  const loadQuestions = (tid: number) => api.get(`/topics/${tid}`).then(r => setQuestions(r.data.questions))

  useEffect(() => { loadSubjects() }, [])

  const openSubject = (s: Subject) => {
    setSelectedSubject(s)
    setView('topics')
    loadTopics(s.id)
  }

  const openTopic = (t: Topic) => {
    setSelectedTopic(t)
    setView('questions')
    loadQuestions(t.id)
  }

  const goBack = () => {
    if (view === 'questions') { setView('topics'); setSelectedTopic(null) }
    else if (view === 'topics') { setView('subjects'); setSelectedSubject(null); loadSubjects() }
  }

  // ===== TOPIC CRUD =====
  const openCreateTopic = () => { setEditingTopic(null); setTopicForm({ name: '', description: '' }); setShowTopicModal(true) }
  const openEditTopic = (t: Topic) => { setEditingTopic(t); setTopicForm({ name: t.name, description: t.description || '' }); setShowTopicModal(true) }

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, topicForm)
        toast.success('Mavzu yangilandi')
      } else {
        await api.post('/topics', { ...topicForm, subject_id: selectedSubject!.id })
        toast.success('Mavzu yaratildi')
      }
      setShowTopicModal(false)
      loadTopics(selectedSubject!.id)
    } catch { toast.error('Xatolik') }
  }

  const deleteTopic = async (t: Topic) => {
    if (!confirm(`"${t.name}" mavzusini o'chirishni tasdiqlaysizmi?`)) return
    await api.delete(`/topics/${t.id}`)
    toast.success('Mavzu o\'chirildi')
    loadTopics(selectedSubject!.id)
  }

  // ===== QUESTION CRUD =====
  const emptyQ = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' }
  const openCreateQ = () => { setEditingQ(null); setQForm({ ...emptyQ }); setShowQModal(true) }
  const openEditQ = (q: Question) => { setEditingQ(q); setQForm({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option }); setShowQModal(true) }

  const handleQSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingQ) {
        await api.put(`/topics/questions/${editingQ.id}`, qForm)
        toast.success('Savol yangilandi')
      } else {
        await api.post(`/topics/${selectedTopic!.id}/questions`, qForm)
        toast.success('Savol qo\'shildi')
      }
      setShowQModal(false)
      loadQuestions(selectedTopic!.id)
    } catch { toast.error('Xatolik') }
  }

  const deleteQ = async (q: Question) => {
    if (!confirm('Savolni o\'chirishni tasdiqlaysizmi?')) return
    await api.delete(`/topics/questions/${q.id}`)
    toast.success('Savol o\'chirildi')
    loadQuestions(selectedTopic!.id)
  }

  // ===== RENDER =====
  if (view === 'subjects') {
    return (
      <div>
        <PageHeader icon={<IconFolder size={22} />} iconColor="var(--success)" iconBg="var(--success-50)" title="Test bazasi" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {subjects.filter(s => s.is_active).map(s => (
            <Card key={s.id} className="subject-manage-card">
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, cursor: 'pointer' }} onClick={() => openSubject(s)}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SubjectIcon icon={s.icon} size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-50)' }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-500)', display: 'flex', gap: 12, marginTop: 2 }}>
                      <span>{s.topic_count} mavzu</span>
                      <span>{s.question_count} savol</span>
                    </div>
                  </div>
                  <IconChevronRight size={20} style={{ color: 'var(--text-500)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <Badge variant="info">{s.price_per_question.toLocaleString()} so'm / test</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'topics') {
    return (
      <div>
        <PageHeader
          icon={<IconFolder size={22} />} iconColor="var(--info)" iconBg="var(--info-50)"
          title={selectedSubject!.name}
          badge={<Badge variant="purple">{topics.length} mavzu</Badge>}
          actions={<>
            <Button variant="ghost" size="sm" onClick={goBack}><IconArrowLeft size={16} /> Orqaga</Button>
            <Button onClick={openCreateTopic}><IconPlus size={18} /> Mavzu qo'shish</Button>
          </>}
        />

        <Card>
          <CardBody flush>
            <Table
              keyField="id"
              data={topics}
              emptyIcon={<IconFolder size={40} />}
              emptyText="Mavzular mavjud emas"
              columns={[
                { key: 'name', header: 'Mavzu nomi', render: t => (
                  <span className="td-main" style={{ cursor: 'pointer' }} onClick={() => openTopic(t)}>{t.name}</span>
                )},
                { key: 'desc', header: 'Tavsif', render: t => <span style={{ color: 'var(--text-500)' }}>{t.description || '—'}</span> },
                { key: 'count', header: 'Savollar', render: t => <Badge variant="purple">{t.question_count}</Badge> },
                { key: 'status', header: 'Holat', render: t => <Badge variant={t.is_active ? 'success' : 'danger'}>{t.is_active ? 'Faol' : 'O\'chiq'}</Badge> },
                { key: 'actions', header: '', width: 100, render: t => (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="primary" size="sm" onClick={() => openTopic(t)}><IconChevronRight size={14} /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditTopic(t)}><IconEdit size={15} /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteTopic(t)} style={{ color: 'var(--danger)' }}><IconTrash size={15} /></Button>
                  </div>
                )},
              ]}
            />
          </CardBody>
        </Card>

        <Dialog open={showTopicModal} onClose={() => setShowTopicModal(false)} title={editingTopic ? 'Mavzuni tahrirlash' : 'Yangi mavzu'}
          footer={<>
            <Button variant="ghost" onClick={() => setShowTopicModal(false)}>Bekor qilish</Button>
            <Button type="submit" form="topic-form">{editingTopic ? 'Saqlash' : 'Yaratish'}</Button>
          </>}
        >
          <form id="topic-form" onSubmit={handleTopicSubmit}>
            <Input label="Mavzu nomi" value={topicForm.name} onChange={e => setTopicForm({ ...topicForm, name: e.target.value })} placeholder="Algebra asoslari" required />
            <Textarea label="Tavsif" value={topicForm.description} onChange={e => setTopicForm({ ...topicForm, description: e.target.value })} placeholder="Mavzu haqida..." />
          </form>
        </Dialog>
      </div>
    )
  }

  // view === 'questions'
  return (
    <div>
      <PageHeader
        icon={<IconQuestionMark size={22} />} iconColor="var(--warning)" iconBg="var(--warning-50)"
        title={selectedTopic!.name}
        badge={<Badge variant="purple">{questions.length} savol</Badge>}
        actions={<>
          <Button variant="ghost" size="sm" onClick={goBack}><IconArrowLeft size={16} /> Mavzularga</Button>
          <Button onClick={openCreateQ}><IconPlus size={18} /> Savol qo'shish</Button>
        </>}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={questions}
            emptyIcon={<IconQuestionMark size={40} />}
            emptyText="Savollar mavjud emas"
            columns={[
              { key: 'num', header: '#', width: 50, render: (_, i) => <span style={{ color: 'var(--text-500)' }}>{i + 1}</span> },
              { key: 'text', header: 'Savol', render: q => (
                <div>
                  <div className="td-main" style={{ maxWidth: 400, whiteSpace: 'normal', lineHeight: 1.4 }}>{q.question_text}</div>
                  <div className="td-sub" style={{ marginTop: 4 }}>
                    A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d}
                  </div>
                </div>
              )},
              { key: 'answer', header: 'Javob', width: 70, render: q => <Badge variant="success">{q.correct_option}</Badge> },
              { key: 'actions', header: '', width: 80, render: q => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditQ(q)}><IconEdit size={15} /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteQ(q)} style={{ color: 'var(--danger)' }}><IconTrash size={15} /></Button>
                </div>
              )},
            ]}
          />
        </CardBody>
      </Card>

      <Dialog open={showQModal} onClose={() => setShowQModal(false)} title={editingQ ? 'Savolni tahrirlash' : 'Yangi savol'} size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => setShowQModal(false)}>Bekor qilish</Button>
          <Button type="submit" form="q-form">{editingQ ? 'Saqlash' : 'Qo\'shish'}</Button>
        </>}
      >
        <form id="q-form" onSubmit={handleQSubmit}>
          <Textarea label="Savol matni" value={qForm.question_text} onChange={e => setQForm({ ...qForm, question_text: e.target.value })} required placeholder="Savolni yozing..." />
          <div className="grid-2">
            <Input label="A variant" value={qForm.option_a} onChange={e => setQForm({ ...qForm, option_a: e.target.value })} required />
            <Input label="B variant" value={qForm.option_b} onChange={e => setQForm({ ...qForm, option_b: e.target.value })} required />
          </div>
          <div className="grid-2">
            <Input label="C variant" value={qForm.option_c} onChange={e => setQForm({ ...qForm, option_c: e.target.value })} required />
            <Input label="D variant" value={qForm.option_d} onChange={e => setQForm({ ...qForm, option_d: e.target.value })} required />
          </div>
          <Select label="To'g'ri javob" options={['A','B','C','D'].map(v => ({ value: v, label: `${v} variant` }))}
            value={qForm.correct_option} onChange={v => setQForm({ ...qForm, correct_option: String(v) })} isSearchable={false} />
        </form>
      </Dialog>
    </div>
  )
}
