import { ReactNode } from 'react'

type Color = 'purple' | 'green' | 'amber' | 'cyan' | 'red'

interface StatCardProps {
  icon: ReactNode
  color: Color
  label: string
  value: string | number
  change?: ReactNode
}

export default function StatCard({ icon, color, label, value, change }: StatCardProps) {
  return (
    <div className="ui-stat">
      <div className={`ui-stat-icon ui-stat-icon--${color}`}>{icon}</div>
      <div className="ui-stat-info">
        <div className="ui-stat-label">{label}</div>
        <div className="ui-stat-value">{value}</div>
        {change && <div className="ui-stat-change">{change}</div>}
      </div>
    </div>
  )
}
