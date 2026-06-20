import { ReactNode } from 'react'

interface PageHeaderProps {
  icon: ReactNode
  iconColor: string
  iconBg: string
  title: string
  badge?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ icon, iconColor, iconBg, title, badge, actions }: PageHeaderProps) {
  return (
    <div className="ui-page-header">
      <div className="ui-page-title">
        <div className="ui-page-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <h1>{title}</h1>
        {badge}
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </div>
  )
}
