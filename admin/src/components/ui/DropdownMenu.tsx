import { ReactNode, useState, useRef, useEffect } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="ui-dropdown" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`ui-dropdown-menu ui-dropdown-menu--${align}`}>
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
        </div>
      )}
    </div>
  )
}
