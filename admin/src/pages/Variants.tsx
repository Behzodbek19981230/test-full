import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  IconFileText, IconClock, IconCircleCheck, IconCircleX, IconSend, IconRefresh,
} from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Badge, Card, CardBody, Pagination } from '../components/ui'
import Table from '../components/ui/Table'

interface Variant {
  id: number
  payment_id: number
  user: { full_name: string; username: string; telegram_id: number } | null
  subject_name: string
  question_count: number
  status: string
  error_log: string | null
  created_at: string
  sent_at: string | null
}

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info'; icon: typeof IconClock }> = {
  pending: { label: 'Kutilmoqda', variant: 'warning', icon: IconClock },
  sent: { label: 'Yuborildi', variant: 'success', icon: IconSend },
  failed: { label: 'Yuborilmadi', variant: 'danger', icon: IconCircleX },
  checked: { label: 'Tekshirildi', variant: 'info', icon: IconCircleCheck },
}

export default function Variants() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/variants?${params}`).then(r => {
      setVariants(r.data.variants)
      setTotal(r.data.total)
    })
  }

  useEffect(() => { load() }, [page, statusFilter])

  const resend = async (id: number) => {
    try {
      await api.post(`/variants/${id}/resend`)
      toast.success('Qayta yuborish boshlandi')
      setTimeout(load, 2000)
    } catch {
      toast.error('Xatolik')
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/variants/${id}/status`, { status })
      toast.success('Status yangilandi')
      load()
    } catch {
      toast.error('Xatolik')
    }
  }

  const statusBadge = (s: string) => {
    const cfg = STATUS_MAP[s] || STATUS_MAP.pending
    const Icon = cfg.icon
    return <Badge variant={cfg.variant}><Icon size={13} /> {cfg.label}</Badge>
  }

  const tabs = [
    { key: '', label: 'Barchasi' },
    { key: 'pending', label: 'Kutilmoqda' },
    { key: 'sent', label: 'Yuborildi' },
    { key: 'failed', label: 'Yuborilmadi' },
    { key: 'checked', label: 'Tekshirildi' },
  ]

  return (
    <div>
      <PageHeader
        icon={<IconFileText size={22} />}
        iconColor="var(--primary)"
        iconBg="var(--primary-50)"
        title="Variantlar"
        actions={<>
          {tabs.map(t => (
            <Button key={t.key} variant={statusFilter === t.key ? 'primary' : 'ghost'} size="sm"
              onClick={() => { setStatusFilter(t.key); setPage(1) }}>
              {t.label}
            </Button>
          ))}
        </>}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={variants}
            emptyIcon={<IconFileText size={40} />}
            emptyText="Variantlar topilmadi"
            columns={[
              { key: 'id', header: 'ID', width: 70, render: v => <strong>#{v.id}</strong> },
              { key: 'user', header: 'Foydalanuvchi', render: v => (
                <>
                  <div className="td-main">{v.user?.full_name || '—'}</div>
                  <div className="td-sub">@{v.user?.username || 'noma\'lum'}</div>
                </>
              )},
              { key: 'subject', header: 'Fan', render: v => v.subject_name },
              { key: 'count', header: 'Savollar', width: 90, render: v => `${v.question_count} ta` },
              { key: 'status', header: 'Holat', render: v => (
                <div>
                  {statusBadge(v.status)}
                  {v.status === 'failed' && v.error_log && (
                    <div className="td-sub" style={{ color: 'var(--danger)', marginTop: 4, fontSize: 11, maxWidth: 200, wordBreak: 'break-word' }}>
                      {v.error_log}
                    </div>
                  )}
                </div>
              )},
              { key: 'date', header: 'Yaratilgan', render: v => (
                <span style={{ fontSize: 13, color: 'var(--text-500)' }}>
                  {new Date(v.created_at).toLocaleString('uz-UZ')}
                </span>
              )},
              { key: 'sent', header: 'Yuborilgan', render: v => (
                <span style={{ fontSize: 13, color: 'var(--text-500)' }}>
                  {v.sent_at ? new Date(v.sent_at).toLocaleString('uz-UZ') : '—'}
                </span>
              )},
              { key: 'actions', header: '', width: 160, render: v => (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(v.status === 'failed' || v.status === 'pending') && (
                    <Button variant="ghost" size="sm" onClick={() => resend(v.id)}>
                      <IconRefresh size={14} /> Qayta yuborish
                    </Button>
                  )}
                  {v.status === 'sent' && (
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(v.id, 'checked')}>
                      <IconCircleCheck size={14} /> Tekshirildi
                    </Button>
                  )}
                </div>
              )},
            ]}
          />
        </CardBody>
        <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
      </Card>
    </div>
  )
}
