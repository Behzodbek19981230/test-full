import { useEffect, useState } from 'react'
import { IconUsers, IconSearch, IconBan, IconCircleCheck } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Badge, Card, CardBody, Input, Pagination, PageLoader } from '../components/ui'
import Table from '../components/ui/Table'

interface User {
  id: number; telegram_id: number; username: string; full_name: string
  phone: string; role: string; is_active: boolean; created_at: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const load = () => {
    api.get(`/users?page=${page}&per_page=10&search=${search}`).then(r => {
      setUsers(r.data.users); setTotal(r.data.total)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, search])

  const toggleActive = async (id: number) => { await api.put(`/users/${id}/toggle-active`); load() }

  if (loading) return <PageLoader rows={8} />

  return (
    <div>
      <PageHeader
        icon={<IconUsers size={22} />} iconColor="var(--primary)" iconBg="var(--primary-50)" title="Foydalanuvchilar"
        badge={<Badge variant="info">{total}</Badge>}
        actions={<Input icon={IconSearch} placeholder="Qidirish..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: 240 }} />}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={users}
            emptyIcon={<IconUsers size={40} />}
            emptyText="Foydalanuvchilar topilmadi"
            columns={[
              { key: 'name', header: 'Ism', render: u => <span className="td-main">{u.full_name}</span> },
              { key: 'username', header: 'Username', render: u => <span style={{ color: 'var(--text-500)' }}>@{u.username || '—'}</span> },
              { key: 'tg', header: 'Telegram ID', render: u => <span className="td-mono">{u.telegram_id}</span> },
              { key: 'phone', header: 'Telefon', render: u => u.phone || '—' },
              { key: 'role', header: 'Rol', render: u => <Badge variant="info">{u.role}</Badge> },
              { key: 'status', header: 'Holat', render: u => <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Faol' : 'Bloklangan'}</Badge> },
              { key: 'date', header: 'Sana', render: u => <span style={{ fontSize: 13, color: 'var(--text-500)' }}>{new Date(u.created_at).toLocaleDateString('uz-UZ')}</span> },
              { key: 'actions', header: '', width: 90, render: u => (
                <Button variant={u.is_active ? 'warning' : 'success'} size="sm" onClick={() => toggleActive(u.id)}>
                  {u.is_active ? <><IconBan size={14} /> Blok</> : <><IconCircleCheck size={14} /> Yoq</>}
                </Button>
              )},
            ]}
          />
        </CardBody>
        <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      </Card>
    </div>
  )
}
