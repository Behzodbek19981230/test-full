import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'secondary'
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'ui-btn--primary',
  success: 'ui-btn--success',
  danger: 'ui-btn--danger',
  warning: 'ui-btn--warning',
  ghost: 'ui-btn--ghost',
  secondary: 'ui-btn--secondary',
}

const sizeStyles: Record<Size, string> = {
  sm: 'ui-btn--sm',
  md: '',
  lg: 'ui-btn--lg',
  icon: 'ui-btn--icon',
  'icon-sm': 'ui-btn--icon ui-btn--icon-sm',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props
}, ref) => {
  const cls = [
    'ui-btn',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? 'ui-btn--full' : '',
    loading ? 'ui-btn--loading' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...props}>
      {loading && <span className="ui-btn-spinner" />}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
