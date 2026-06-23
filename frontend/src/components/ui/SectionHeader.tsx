import { ReactNode } from 'react'

interface Props {
  label: ReactNode
  title: string
  desc: string
}

export default function SectionHeader({ label, title, desc }: Props) {
  return (
    <div className="text-center mb-10 sm:mb-14">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
        {label}
      </div>
      <h2 className="text-[26px] sm:text-[32px] lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight">{title}</h2>
      <p className="text-[14px] sm:text-[17px] text-slate-600 max-w-[520px] mx-auto leading-relaxed">{desc}</p>
    </div>
  )
}
