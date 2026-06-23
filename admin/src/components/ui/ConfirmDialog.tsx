import { ReactNode } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import Dialog from './Dialog'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: ReactNode
  confirmText?: string
  confirmVariant?: 'danger' | 'primary' | 'success'
  loading?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = "Tasdiqlash",
  message, confirmText = "O'chirish", confirmVariant = 'danger', loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm" footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Bekor qilish</Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </>
    }>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'var(--danger-50)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconAlertTriangle size={22} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-300)', lineHeight: 1.6, paddingTop: 2 }}>
          {message}
        </div>
      </div>
    </Dialog>
  )
}
