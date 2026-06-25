import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconSettings, IconCoin, IconStarFilled } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Card, CardBody, SubjectIcon, Badge, PageLoader } from '../components/ui'

type Tab = 'tariffs'

interface Subject {
  id: number
  name: string
  icon: string
  is_active: boolean
  is_free: boolean
  is_mandatory: boolean
}

const TABS: { key: Tab; icon: React.ReactNode; label: string }[] = [
  { key: 'tariffs', icon: <IconCoin size={16} />, label: "Ta'riflar" },
]

export default function Settings() {
  const [tab, setTab] = useState<Tab>('tariffs')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  const load = () =>
    api.get('/subjects/all').then(r => setSubjects(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const toggleFree = async (subject: Subject, isFree: boolean) => {
    if (subject.is_free === isFree) return
    setSaving(subject.id)
    try {
      await api.put(`/subjects/${subject.id}`, { is_free: isFree })
      setSubjects(prev =>
        prev.map(s => s.id === subject.id ? { ...s, is_free: isFree } : s)
      )
      toast.success(
        isFree
          ? `${subject.name} — tekin qilindi`
          : `${subject.name} — pullik qilindi`
      )
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <PageLoader rows={6} />

  const activeSubjects = subjects.filter(s => s.is_active)

  return (
    <div>
      <PageHeader
        icon={<IconSettings size={22} />}
        iconColor="var(--primary)"
        iconBg="var(--primary-50)"
        title="Sozlamalar"
        actions={
          <>
            {TABS.map(t => (
              <Button
                key={t.key}
                variant={tab === t.key ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
              </Button>
            ))}
          </>
        }
      />

      {tab === 'tariffs' && (
        <Card>
          <CardBody>
            <p style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 16 }}>
              Har bir fan uchun test tekin yoki pullik ekanligini belgilang. Tekin fanlarda foydalanuvchi to'lovsiz test oladi.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeSubjects.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    background: 'var(--bg-900)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <SubjectIcon icon={s.icon} size={32} />

                  <div style={{ minWidth: 120 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-100)' }}>
                      {s.name}
                    </span>
                    {s.is_mandatory && (
                      <Badge variant="purple" className="" >
                        <IconStarFilled size={10} /> Majburiy
                      </Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        cursor: saving === s.id ? 'wait' : 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: !s.is_free ? 'var(--primary)' : 'var(--border)',
                        background: !s.is_free ? 'var(--primary-50)' : 'transparent',
                        color: !s.is_free ? 'var(--primary)' : 'var(--text-500)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name={`pricing-${s.id}`}
                        checked={!s.is_free}
                        onChange={() => toggleFree(s, false)}
                        disabled={saving === s.id}
                        style={{ display: 'none' }}
                      />
                      Pullik
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        cursor: saving === s.id ? 'wait' : 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: s.is_free ? '#22c55e' : 'var(--border)',
                        background: s.is_free ? 'rgba(34,197,94,0.08)' : 'transparent',
                        color: s.is_free ? '#22c55e' : 'var(--text-500)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name={`pricing-${s.id}`}
                        checked={s.is_free}
                        onChange={() => toggleFree(s, true)}
                        disabled={saving === s.id}
                        style={{ display: 'none' }}
                      />
                      Tekin
                    </label>
                  </div>
                </div>
              ))}

              {activeSubjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-500)' }}>
                  Faol fanlar mavjud emas
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
