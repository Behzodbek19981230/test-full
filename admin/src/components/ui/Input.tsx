import { InputHTMLAttributes, forwardRef } from 'react'
import type { Icon } from '@tabler/icons-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: Icon
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, icon: IconComp, hint, className = '', ...props
}, ref) => {
  return (
    <div className="ui-field">
      {label && <label className="ui-label">{label}</label>}
      <div className={`ui-input-wrap ${IconComp ? 'ui-input-wrap--icon' : ''} ${error ? 'ui-input-wrap--error' : ''}`}>
        {IconComp && <IconComp size={16} className="ui-input-icon" />}
        <input ref={ref} className={`ui-input ${className}`} {...props} />
      </div>
      {error && <span className="ui-field-error">{error}</span>}
      {hint && !error && <span className="ui-field-hint">{hint}</span>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
