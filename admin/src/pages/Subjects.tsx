import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconBooks, IconPlus, IconEdit, IconBan, IconCheck } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Dialog, Input, Textarea, Badge, Card, CardBody, DropdownMenu, IconPicker } from '../components/ui'
import Table from '../components/ui/Table'

interface Subject {
  id: number; name: string; description: string; icon: string; is_active: boolean; test_count: number
}

function SubjectIcon({ icon, size = 24 }: { icon: string; size?: number }) {
  if (icon.startsWith('<svg')) {
    return <span style={{ width: size, height: size, display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: icon }} />
  }
  if (icon.startsWith('/api/')) {
    return <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  }
  return <span style={{ fontSize: size }}>{icon}</span>
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [form, setForm] = useState({ name: '', description: '', icon: '📚' })

  const load = () => api.get('/subjects/all').then(r => setSubjects(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', icon: '📚' }); setShowModal(true) }
  const openEdit = (s: Subject) => { setEditing(s); setForm({ name: s.name, description: s.description || '', icon: s.icon }); setShowModal(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/subjects/${editing.id}`, form); toast.success('Fan yangilandi') }
      else { await api.post('/subjects', form); toast.success('Fan yaratildi') }
      setShowModal(false); load()
    } catch { toast.error('Xatolik yuz berdi') }
  }

  const toggleActive = async (s: Subject) => {
    await api.put(`/subjects/${s.id}`, { is_active: !s.is_active })
    toast.success(s.is_active ? 'Fan o\'chirildi' : 'Fan yoqildi')
    load()
  }

  return (
    <div>
      <PageHeader
        icon={<IconBooks size={22} />} iconColor="var(--info)" iconBg="var(--info-50)" title="Fanlar"
        actions={<Button onClick={openCreate}><IconPlus size={18} /> Yangi fan</Button>}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={subjects}
            emptyIcon={<IconBooks size={40} />}
            emptyText="Fanlar mavjud emas"
            columns={[
              { key: 'icon', header: '', width: 60, render: s => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <SubjectIcon icon={s.icon} size={32} />
                </div>
              )},
              { key: 'name', header: 'Nomi', render: s => <span className="td-main">{s.name}</span> },
              { key: 'desc', header: 'Tavsif', render: s => <span style={{ color: 'var(--text-500)' }}>{s.description || '—'}</span> },
              { key: 'tests', header: 'Testlar', render: s => <Badge variant="purple">{s.test_count}</Badge> },
              { key: 'status', header: 'Holat', render: s => <Badge variant={s.is_active ? 'success' : 'danger'}>{s.is_active ? 'Faol' : 'O\'chiq'}</Badge> },
              { key: 'actions', header: '', width: 80, render: s => (
                <DropdownMenu
                  trigger={<Button variant="ghost" size="icon-sm">•••</Button>}
                  items={[
                    { label: 'Tahrirlash', icon: <IconEdit size={15} />, onClick: () => openEdit(s) },
                    { label: s.is_active ? 'O\'chirish' : 'Yoqish', icon: s.is_active ? <IconBan size={15} /> : <IconCheck size={15} />,
                      onClick: () => toggleActive(s), variant: s.is_active ? 'danger' as const : 'default' as const },
                  ]}
                />
              )},
            ]}
          />
        </CardBody>
      </Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Fanni tahrirlash' : 'Yangi fan'} size="md"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Bekor qilish</Button>
          <Button type="submit" form="subject-form">{editing ? 'Saqlash' : 'Yaratish'}</Button>
        </>}
      >
        <form id="subject-form" onSubmit={handleSubmit}>
          <Input label="Fan nomi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Matematika" required />
          <Textarea label="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Fan haqida qisqacha..." />
          <IconPicker label="Fan ikonkasi" value={form.icon} onChange={icon => setForm({ ...form, icon })} />
        </form>
      </Dialog>
    </div>
  )
}
