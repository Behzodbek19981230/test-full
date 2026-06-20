import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconCreditCard, IconEye, IconClock, IconCircleCheck, IconCircleX, IconPhoto } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Dialog, Badge, Card, CardBody, Textarea, Pagination } from '../components/ui'
import Table from '../components/ui/Table'

interface Payment {
  id: number
  user: { full_name: string; username: string; telegram_id: number }
  subject_name: string
  question_count: number
  mode: string
  amount: number; screenshot_file_id: string; status: string; admin_note: string; created_at: string
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected] = useState<Payment | null>(null)
  const [note, setNote] = useState('')

  const load = () => {
    api.get(`/payments?status=${statusFilter}&page=${page}&per_page=20`).then(r => {
      setPayments(r.data.payments); setTotal(r.data.total)
    })
  }

  useEffect(() => { load() }, [page, statusFilter])

  const approve = async (id: number) => {
    try { await api.put(`/payments/${id}/approve`, { note }); toast.success('To\'lov tasdiqlandi'); setSelected(null); setNote(''); load() }
    catch { toast.error('Xatolik') }
  }

  const reject = async (id: number) => {
    if (!note.trim()) { toast.error('Rad etish sababini yozing'); return }
    try { await api.put(`/payments/${id}/reject`, { note }); toast.success('To\'lov rad etildi'); setSelected(null); setNote(''); load() }
    catch { toast.error('Xatolik') }
  }

  const statusBadge = (s: string) => {
    if (s === 'pending') return <Badge variant="warning"><IconClock size={13} /> Kutilmoqda</Badge>
    if (s === 'approved') return <Badge variant="success"><IconCircleCheck size={13} /> Tasdiqlangan</Badge>
    return <Badge variant="danger"><IconCircleX size={13} /> Rad etilgan</Badge>
  }

  const tabs = [
    { key: 'pending', icon: <IconClock size={16} />, label: 'Kutilmoqda' },
    { key: 'approved', icon: <IconCircleCheck size={16} />, label: 'Tasdiqlangan' },
    { key: 'rejected', icon: <IconCircleX size={16} />, label: 'Rad etilgan' },
  ]

  return (
    <div>
      <PageHeader
        icon={<IconCreditCard size={22} />} iconColor="var(--warning)" iconBg="var(--warning-50)" title="To'lovlar"
        actions={<>
          {tabs.map(t => (
            <Button key={t.key} variant={statusFilter === t.key ? 'primary' : 'ghost'} size="sm"
              onClick={() => { setStatusFilter(t.key); setPage(1) }}>
              {t.icon} {t.label}
            </Button>
          ))}
        </>}
      />

      <Card>
        <CardBody flush>
          <Table
            keyField="id"
            data={payments}
            emptyIcon={<IconCreditCard size={40} />}
            emptyText="To'lovlar topilmadi"
            columns={[
              { key: 'user', header: 'Foydalanuvchi', render: p => (
                <><div className="td-main">{p.user?.full_name}</div><div className="td-sub">@{p.user?.username || 'noma\'lum'}</div></>
              )},
              { key: 'test', header: 'Test', render: p => `${p.subject_name} (${p.question_count} ta, ${p.mode === 'mixed' ? 'aralash' : 'mavzuli'})` },
              { key: 'amount', header: 'Summa', render: p => <strong>{p.amount.toLocaleString()} so'm</strong> },
              { key: 'status', header: 'Holat', render: p => statusBadge(p.status) },
              { key: 'date', header: 'Sana', render: p => <span style={{ fontSize: 13, color: 'var(--text-500)' }}>{new Date(p.created_at).toLocaleString('uz-UZ')}</span> },
              { key: 'actions', header: '', width: 50, render: p => (
                <Button variant="ghost" size="icon-sm" onClick={() => { setSelected(p); setNote('') }}><IconEye size={16} /></Button>
              )},
            ]}
          />
        </CardBody>
        <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={`To'lov #${selected?.id || ''}`}
        footer={selected?.status === 'pending' ? <>
          <Button variant="danger" onClick={() => reject(selected!.id)}><IconCircleX size={16} /> Rad etish</Button>
          <Button variant="success" onClick={() => approve(selected!.id)}><IconCircleCheck size={16} /> Tasdiqlash</Button>
        </> : undefined}
      >
        {selected && <>
          <div className="ui-detail-grid" style={{ marginBottom: 16 }}>
            <div className="ui-detail-item">
              <div className="ui-detail-label">Foydalanuvchi</div>
              <div className="ui-detail-value">{selected.user?.full_name}</div>
              <div className="td-sub">@{selected.user?.username} | TG: {selected.user?.telegram_id}</div>
            </div>
            <div className="ui-detail-item">
              <div className="ui-detail-label">Fan / Test</div>
              <div className="ui-detail-value">{selected.subject_name}</div>
              <div className="td-sub">{selected.question_count} ta · {selected.mode === 'mixed' ? 'Aralash' : 'Mavzulashtirilgan'}</div>
            </div>
            <div className="ui-detail-item">
              <div className="ui-detail-label">Summa</div>
              <div className="ui-detail-value" style={{ color: 'var(--warning)' }}>{selected.amount.toLocaleString()} so'm</div>
            </div>
            <div className="ui-detail-item">
              <div className="ui-detail-label">Holat</div>
              <div style={{ marginTop: 4 }}>{statusBadge(selected.status)}</div>
            </div>
          </div>

          {selected.screenshot_file_id && (
            <div className="ui-detail-item" style={{ marginBottom: 16 }}>
              <div className="ui-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconPhoto size={14} /> Screenshot</div>
              <code className="td-mono" style={{ wordBreak: 'break-all', color: 'var(--text-400)', fontSize: 11 }}>{selected.screenshot_file_id}</code>
            </div>
          )}

          {selected.status === 'pending' && (
            <Textarea label="Izoh" value={note} onChange={e => setNote(e.target.value)} placeholder="Ixtiyoriy izoh..." />
          )}

          {selected.status !== 'pending' && selected.admin_note && (
            <div className="ui-detail-item">
              <div className="ui-detail-label">Admin izohi</div>
              <div style={{ fontSize: 14, color: 'var(--text-300)' }}>{selected.admin_note}</div>
            </div>
          )}
        </>}
      </Dialog>
    </div>
  )
}
