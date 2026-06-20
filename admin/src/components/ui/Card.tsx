import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`ui-card ${className}`}>{children}</div>
}

interface CardHeaderProps {
  title: string
  icon?: ReactNode
  action?: ReactNode
}

export function CardHeader({ title, icon, action }: CardHeaderProps) {
  return (
    <div className="ui-card-header">
      <h2>{icon}{title}</h2>
      {action}
    </div>
  )
}

export function CardBody({ children, flush }: { children: ReactNode; flush?: boolean }) {
  return <div className={flush ? 'ui-card-body--flush' : 'ui-card-body'}>{children}</div>
}
