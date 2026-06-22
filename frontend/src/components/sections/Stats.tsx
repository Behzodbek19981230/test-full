import { IconUsers, IconClipboardCheck, IconChartBar, IconBooks } from '@tabler/icons-react'
import { Container } from '../ui'

interface Props {
  stats: { total_users: number; total_questions: number; total_attempts: number; total_subjects: number }
}

const items = [
  { icon: IconUsers, color: 'text-primary-light bg-primary/[0.08]', key: 'total_users' as const, fallback: 500, label: 'Foydalanuvchilar' },
  { icon: IconClipboardCheck, color: 'text-secondary bg-secondary/10', key: 'total_questions' as const, fallback: 500, label: 'Savollar' },
  { icon: IconChartBar, color: 'text-success bg-success/10', key: 'total_attempts' as const, fallback: 2500, label: 'Ishlangan testlar' },
  { icon: IconBooks, color: 'text-accent bg-accent/10', key: 'total_subjects' as const, fallback: 12, label: 'Fanlar' },
]

export default function Stats({ stats }: Props) {
  return (
    <section className="py-16 border-y border-slate-200 bg-white">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <div key={i} className="text-center py-6 relative">
              {i < items.length - 1 && <div className="hidden lg:block absolute right-0 top-[20%] h-[60%] w-px bg-slate-200" />}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${s.color}`}>
                <s.icon size={24} />
              </div>
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {(stats[s.key] || s.fallback).toLocaleString()}+
              </div>
              <div className="text-sm text-slate-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
