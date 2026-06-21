import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconFolder, IconChevronRight, IconBooks } from '@tabler/icons-react'
import api from '../../api'
import { PageHeader, Badge, Card, CardBody, SubjectIcon } from '../../components/ui'

interface Subject {
  id: number; name: string; icon: string; topic_count: number; question_count: number
  price_per_question: number; is_active: boolean
}

export default function TestSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const navigate = useNavigate()

  useEffect(() => { api.get('/subjects/all').then(r => setSubjects(r.data)) }, [])

  const active = subjects.filter(s => s.is_active)

  return (
    <div>
      <PageHeader
        icon={<IconFolder size={22} />}
        iconColor="var(--success)"
        iconBg="var(--success-50)"
        title="Test bazasi"
        badge={<Badge variant="purple">{active.length} fan</Badge>}
      />

      {active.length === 0 ? (
        <Card>
          <CardBody>
            <div className="ui-empty">
              <div className="ui-empty-icon"><IconBooks size={48} /></div>
              <p>Fanlar mavjud emas. Avval "Fanlar" bo'limida fan yarating.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="test-subjects-grid">
          {active.map(s => (
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
          ))}
        </div>
      )}
    </div>
  )
}
