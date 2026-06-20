import { ReactNode, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Dialog({ open, onClose, title, children, footer, size = 'md' }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      document.addEventListener('keydown', handleEsc)
      return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc) }
    }
    document.body.style.overflow = ''
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ui-dialog-overlay" onClick={onClose}>
      <div className={`ui-dialog ui-dialog--${size}`} onClick={e => e.stopPropagation()}>
        <div className="ui-dialog-header">
          <h2>{title}</h2>
          <button className="ui-dialog-close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="ui-dialog-body">
          {children}
        </div>
        {footer && (
          <div className="ui-dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
