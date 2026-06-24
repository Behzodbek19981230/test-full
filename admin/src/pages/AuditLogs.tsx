import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconFileText, IconPlus, IconEdit, IconTrash, IconCircleCheck, IconCircleX, IconKey } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Badge, Card, CardBody, Pagination, ConfirmDialog, PageLoader } from '../components/ui'
import Table from '../components/ui/Table'

interface Log {
  id: number; admin_name: string; action: string; entity_type: string
  entity_id: number; details: string; ip_address: string; created_at: string
}

const actionMeta: Record<string, { icon: React.ReactNode; variant: 'success' | 'info' | 'danger' | 'purple' }> = {
  create: { icon: <IconPlus size={14} />, variant: 'success' },
  update: { icon: <IconEdit size={14} />, variant: 'info' },
  delete: { icon: <IconTrash size={14} />, variant: 'danger' },
  approve: { icon: <IconCircleCheck size={14} />, variant: 'success' },
  reject: { icon: <IconCircleX size={14} />, variant: 'danger' },
  login: { icon: <IconKey size={14} />, variant: 'purple' },
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showClear, setShowClear] = useState(false)

  const load = () => {
    api.get(`/audit-logs?page=${page}&per_page=50`).then(r => { setLogs(r.data.logs); setTotal(r.data.total) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  const clearAll = async () => {
    await api.delete('/audit-logs/clear')
    toast.success('Audit loglar tozalandi')
    setShowClear(false)
    setPage(1)
    load()
  }

  if (loading) return <PageLoader rows={8} />

  return (
    <div>
      <PageHeader
        icon={<IconFileText size={22} />} iconColor="var(--info)" iconBg="var(--info-50)" title="Audit Log"
        badge={<Badge variant="info">{total} yozuv</Badge>}
        actions={total > 0 ? <Button variant="danger" size="sm" onClick={() => setShowClear(true)}><IconTrash size={14} /> Tozalash</Button> : undefined}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={logs}
            emptyIcon={<IconFileText size={40} />}
            emptyText="Loglar mavjud emas"
            columns={[
              { key: 'admin', header: 'Admin', render: l => <span className="td-main">{l.admin_name}</span> },
              { key: 'action', header: 'Amal', render: l => {
                const m = actionMeta[l.action] || { icon: <IconFileText size={14} />, variant: 'info' as const }
                return <><Badge variant={m.variant}>{m.icon} {l.action}</Badge>
                  {l.entity_type && <span className="td-sub" style={{ marginLeft: 6 }}>{l.entity_type} #{l.entity_id}</span>}</>
              }},
              { key: 'details', header: 'Tafsilot', render: l => <span style={{ color: 'var(--text-400)', fontSize: 13, maxWidth: 280, display: 'block' }}>{l.details || '—'}</span> },
              { key: 'ip', header: 'IP', render: l => <span className="td-mono" style={{ color: 'var(--text-600)', fontSize: 12 }}>{l.ip_address || '—'}</span> },
              { key: 'time', header: 'Vaqt', render: l => <span style={{ fontSize: 13, color: 'var(--text-500)', whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString('uz-UZ')}</span> },
            ]}
          />
        </CardBody>
        <Pagination page={page} totalPages={Math.ceil(total / 50)} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        open={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={clearAll}
        message={<>Barcha <strong>{total}</strong> ta audit log o'chiriladi. Bu amalni qaytarib bo'lmaydi.</>}
      />
    </div>
  )
}
