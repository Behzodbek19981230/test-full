import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary'
type Size = 'md' | 'lg'

const variantCls: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.45)] hover:-translate-y-0.5',
  secondary: 'bg-white/[0.06] text-slate-200 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20',
}

const sizeCls: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3.5 text-base rounded-2xl',
}

const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return <button className={`${base} ${variantCls[variant]} ${sizeCls[size]} ${className}`} {...props}>{children}</button>
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function LinkButton({ variant = 'primary', size = 'md', className = '', children, ...props }: LinkButtonProps) {
  return <a className={`${base} ${variantCls[variant]} ${sizeCls[size]} ${className}`} {...props}>{children}</a>
}
