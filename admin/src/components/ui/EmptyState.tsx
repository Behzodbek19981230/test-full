import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  text: string
  action?: ReactNode
}

export default function EmptyState({ icon, text, action }: EmptyStateProps) {
  return (
    <div className="ui-empty">
      <div className="ui-empty-icon">{icon}</div>
      <p>{text}</p>
      {action}
    </div>
  )
}
