import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  IconFileText, IconClock, IconCircleCheck, IconCircleX, IconSend, IconRefresh,
  IconEye, IconCheck, IconX as IconXMark,
} from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Badge, Card, CardBody, Pagination } from '../components/ui'
import Dialog from '../components/ui/Dialog'
import Table from '../components/ui/Table'

interface Variant {
  id: number
  payment_id: number
  user: { full_name: string; username: string; telegram_id: number } | null
  subject_name: string
  question_count: number
  status: string
  user_answers: string | null
  correct_count: number | null
  score: number | null
  error_log: string | null
  created_at: string
  sent_at: string | null
  checked_at: string | null
}

interface QuestionDetail {
  num: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  user_answer: string | null
  is_correct: boolean | null
}

interface VariantDetail extends Variant {
  questions: QuestionDetail[]
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
  const [detail, setDetail] = useState<VariantDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = () => {
    const params = new URLSearchParams({ page: String(page), per_page: '10' })
    if (statusFilter) params.set('status', statusFilter)
    api.get(`/variants?${params}`).then(r => {
      setVariants(r.data.variants)
      setTotal(r.data.total)
    })
  }

  useEffect(() => { load() }, [page, statusFilter])

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const r = await api.get(`/variants/${id}`)
      setDetail(r.data)
    } catch {
      toast.error('Variant ma\'lumotlarini yuklashda xatolik')
    } finally {
      setDetailLoading(false)
    }
  }

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
                  {v.status === 'checked' && v.score !== null && (
                    <div className="td-sub" style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: v.score >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                      {v.correct_count}/{v.question_count} ({v.score}%)
                    </div>
                  )}
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
              { key: 'actions', header: '', width: 200, render: v => (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(v.status === 'sent' || v.status === 'checked') && (
                    <Button variant="ghost" size="sm" onClick={() => openDetail(v.id)}>
                      <IconEye size={14} /> Ko'rish
                    </Button>
                  )}
                  {(v.status === 'failed' || v.status === 'pending') && (
                    <Button variant="ghost" size="sm" onClick={() => resend(v.id)}>
                      <IconRefresh size={14} /> Qayta
                    </Button>
                  )}
                </div>
              )},
            ]}
          />
        </CardBody>
        <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      </Card>

      {/* Variant detail dialog */}
      <Dialog open={!!detail || detailLoading} onClose={() => setDetail(null)} title={detail ? `Variant #${detail.id}` : 'Yuklanmoqda...'} size="lg">
        {detailLoading && !detail && <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-400)' }}>Yuklanmoqda...</p>}
        {detail && (
          <div>
            {/* Info header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, padding: 16, background: 'var(--bg-50)', borderRadius: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 2 }}>Foydalanuvchi</div>
                <div style={{ fontWeight: 600 }}>{detail.user?.full_name || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-400)' }}>@{detail.user?.username || 'noma\'lum'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 2 }}>Fan</div>
                <div style={{ fontWeight: 600 }}>{detail.subject_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 2 }}>Holat</div>
                {statusBadge(detail.status)}
              </div>
              {detail.status === 'checked' && detail.score !== null && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 2 }}>Natija</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: detail.score >= 60 ? 'var(--success)' : 'var(--danger)' }}>
                    {detail.correct_count}/{detail.question_count} ({detail.score}%)
                  </div>
                </div>
              )}
              {detail.checked_at && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 2 }}>Tekshirilgan</div>
                  <div style={{ fontSize: 13 }}>{new Date(detail.checked_at).toLocaleString('uz-UZ')}</div>
                </div>
              )}
            </div>

            {/* Questions table */}
            {detail.questions.length > 0 ? (
              <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: 40 }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Savol</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 80 }}>To'g'ri</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 80 }}>Javob</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.questions.map(q => (
                      <tr key={q.num} style={{ borderBottom: '1px solid var(--border)', background: q.is_correct === false ? 'rgba(239,68,68,0.04)' : undefined }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{q.num}</td>
                        <td style={{ padding: '8px 10px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.question_text.replace(/<[^>]+>/g, '').substring(0, 80)}
                          {q.question_text.length > 80 ? '...' : ''}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>
                          {q.correct_option}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: q.is_correct ? 'var(--success)' : q.user_answer ? 'var(--danger)' : 'var(--text-300)' }}>
                          {q.user_answer || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {q.is_correct === true && <IconCheck size={16} style={{ color: 'var(--success)' }} />}
                          {q.is_correct === false && <IconXMark size={16} style={{ color: 'var(--danger)' }} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-400)' }}>
                {detail.status === 'sent' ? 'Foydalanuvchi hali javob yubormagan' : 'Savollar ma\'lumoti mavjud emas'}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}
