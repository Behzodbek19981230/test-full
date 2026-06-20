import { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export default function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 4,
      left: align === 'right' ? rect.right : rect.left,
    })
  }, [align])

  useEffect(() => {
    if (!open) return
    updatePos()

    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const onScroll = () => setOpen(false)

    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, updatePos])

  return (
    <div className="ui-dropdown" ref={triggerRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && createPortal(
        <div
          ref={menuRef}
          className="ui-dropdown-menu"
          style={{
            position: 'fixed',
            top: pos.top,
            ...(align === 'right' ? { right: window.innerWidth - pos.left } : { left: pos.left }),
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              className={`ui-dropdown-item ${item.variant === 'danger' ? 'ui-dropdown-item--danger' : ''}`}
              onClick={() => { item.onClick(); setOpen(false) }}
              disabled={item.disabled}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
