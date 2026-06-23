import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  IconFolder, IconPlus, IconEdit, IconTrash, IconChevronRight,
  IconArrowLeft, IconArrowsCross,
} from '@tabler/icons-react'
import api from '../../api'
import {
  PageHeader, Button, Dialog, Input, Textarea, Badge, Card, CardBody, SubjectIcon,
} from '../../components/ui'
import Table from '../../components/ui/Table'

interface Subject { id: number; name: string; icon: string }
interface Topic {
  id: number; subject_id: number; name: string; description: string
  question_count: number; is_active: boolean; is_mixed: boolean
}

export default function TestTopics() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const sid = Number(subjectId)

  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [form, setForm] = useState({ name: '', description: '', is_mixed: false })

  useEffect(() => {
    api.get(`/subjects/${sid}`).then(r => setSubject(r.data))
    api.get(`/topics/all?subject_id=${sid}`).then(r => setTopics(r.data))
  }, [sid])

  const reload = () => api.get(`/topics/all?subject_id=${sid}`).then(r => setTopics(r.data))

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', is_mixed: false }); setShowModal(true) }
  const openEdit = (t: Topic) => { setEditing(t); setForm({ name: t.name, description: t.description || '', is_mixed: t.is_mixed || false }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/topics/${editing.id}`, form)
        toast.success('Mavzu yangilandi')
      } else {
        await api.post('/topics', { ...form, subject_id: sid })
        toast.success('Mavzu yaratildi')
      }
      setShowModal(false)
      reload()
    } catch { toast.error('Xatolik') }
  }

  const toggleMixed = async (t: Topic) => {
    await api.put(`/topics/${t.id}`, { is_mixed: !t.is_mixed })
    toast.success(t.is_mixed ? 'Aralash o\'chirildi' : 'Aralash yoqildi')
    reload()
  }

  const deleteTopic = async (t: Topic) => {
    if (!confirm(`"${t.name}" mavzusini o'chirishni tasdiqlaysizmi?`)) return
    await api.delete(`/topics/${t.id}`)
    toast.success("Mavzu o'chirildi")
    reload()
  }

  return (
    <div>
      <PageHeader
        icon={subject ? <SubjectIcon icon={subject.icon} size={22} /> : <IconFolder size={22} />}
        iconColor="var(--info)"
        iconBg="var(--info-50)"
        title={subject?.name || 'Yuklanmoqda...'}
        badge={<Badge variant="purple">{topics.length} mavzu</Badge>}
        actions={<>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tests')}>
            <IconArrowLeft size={16} /> Orqaga
          </Button>
          <Button onClick={openCreate}><IconPlus size={18} /> Mavzu qo'shish</Button>
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
                <div>
                  <span className="td-main" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tests/${sid}/${t.id}`)}>
                    {t.name}
                  </span>
                  {t.is_mixed && (
                    <Badge variant="purple" style={{ marginLeft: 6, fontSize: 10 }}>
                      <IconArrowsCross size={10} /> Aralash
                    </Badge>
                  )}
                </div>
              )},
              { key: 'desc', header: 'Tavsif', render: t => (
                <span style={{ color: 'var(--text-500)' }}>{t.description || '—'}</span>
              )},
              { key: 'count', header: 'Savollar', render: t => <Badge variant="purple">{t.question_count}</Badge> },
              { key: 'mixed', header: 'Aralash', width: 70, render: t => (
                <button
                  onClick={() => toggleMixed(t)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: t.is_mixed ? 'var(--primary)' : 'var(--bg-600)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 8, background: '#fff',
                    position: 'absolute', top: 3,
                    left: t.is_mixed ? 21 : 3,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
              )},
              { key: 'status', header: 'Holat', render: t => (
                <Badge variant={t.is_active ? 'success' : 'danger'}>{t.is_active ? 'Faol' : "O'chiq"}</Badge>
              )},
              { key: 'actions', header: '', width: 120, render: t => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="primary" size="sm" onClick={() => navigate(`/tests/${sid}/${t.id}`)}>
                    <IconChevronRight size={14} /> Savollar
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}><IconEdit size={15} /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteTopic(t)} style={{ color: 'var(--danger)' }}>
                    <IconTrash size={15} />
                  </Button>
                </div>
              )},
            ]}
          />
        </CardBody>
      </Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Mavzuni tahrirlash' : 'Yangi mavzu'}
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Bekor qilish</Button>
          <Button type="submit" form="topic-form">{editing ? 'Saqlash' : 'Yaratish'}</Button>
        </>}
      >
        <form id="topic-form" onSubmit={handleSubmit}>
          <Input label="Mavzu nomi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Algebra asoslari" required />
          <Textarea label="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mavzu haqida..." />
          <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-900)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_mixed}
                onChange={e => setForm({ ...form, is_mixed: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-100)' }}>Aralash test</div>
                <div style={{ fontSize: 12, color: 'var(--text-500)' }}>Test generatsiyada barcha mavzulardan teng taqsimlanadi</div>
              </div>
            </label>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
