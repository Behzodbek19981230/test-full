import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className = '', ...props
}, ref) => {
  return (
    <div className="ui-field">
      {label && <label className="ui-label">{label}</label>}
      <textarea ref={ref} className={`ui-input ui-textarea ${error ? 'ui-input--error' : ''} ${className}`} {...props} />
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  )
})

Textarea.displayName = 'Textarea'
export default Textarea
