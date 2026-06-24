import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconFolder, IconChevronRight, IconBooks, IconStarFilled } from '@tabler/icons-react'
import api from '../../api'
import { PageHeader, Badge, Card, CardBody, SubjectIcon, PageLoader } from '../../components/ui'

interface Subject {
  id: number; name: string; icon: string; topic_count: number; question_count: number
  price_per_question: number; is_active: boolean; is_mandatory: boolean; mandatory_question_count: number
}

export default function TestSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { api.get('/subjects/all').then(r => setSubjects(r.data)).finally(() => setLoading(false)) }, [])

  if (loading) return <PageLoader rows={4} />

  const active = subjects.filter(s => s.is_active && !s.is_mandatory)
  const mandatory = subjects.filter(s => s.is_active && s.is_mandatory)

  const SubjectCard = ({ s }: { s: Subject }) => (
    <div key={s.id} className="test-subject-card" onClick={() => navigate(`/tests/${s.id}`)}>
      <div className="test-subject-card__icon">
        <SubjectIcon icon={s.icon} size={36} />
      </div>
      <div className="test-subject-card__info">
        <h3>{s.name}</h3>
        <div className="test-subject-card__stats">
          <Badge variant="purple">{s.topic_count} mavzu</Badge>
          <Badge variant="info">{s.question_count} savol</Badge>
        </div>
      </div>
      <IconChevronRight size={20} className="test-subject-card__arrow" />
    </div>
  )

  return (
    <div>
      <PageHeader
        icon={<IconFolder size={22} />}
        iconColor="var(--success)"
        iconBg="var(--success-50)"
        title="Test bazasi"
        badge={<Badge variant="purple">{active.length + mandatory.length} fan</Badge>}
      />

      {active.length === 0 && mandatory.length === 0 ? (
        <Card>
          <CardBody>
            <div className="ui-empty">
              <div className="ui-empty-icon"><IconBooks size={48} /></div>
              <p>Fanlar mavjud emas. Avval "Fanlar" bo'limida fan yarating.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="test-subjects-grid">
              {active.map(s => <SubjectCard key={s.id} s={s} />)}
            </div>
          )}

          {mandatory.length > 0 && (
            <div style={{ marginTop: active.length > 0 ? 32 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <IconStarFilled size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-100)' }}>Majburiy fanlar</h3>
                <Badge variant="purple">{mandatory.reduce((s, f) => s + (f.mandatory_question_count || 10), 0)} ta savol</Badge>
              </div>
              <div className="test-subjects-grid">
                {mandatory.map(s => <SubjectCard key={s.id} s={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
