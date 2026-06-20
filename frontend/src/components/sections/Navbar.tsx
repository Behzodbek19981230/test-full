'use client'

import { useState, useEffect } from 'react'
import { IconSchool, IconBrandTelegram, IconMenu2, IconX } from '@tabler/icons-react'
import { LinkButton, Container } from '../ui'

const BOT_URL = 'https://t.me/test_market_uzbot'

const links = [
  { href: '#fanlar', label: 'Fanlar' },
  { href: '#qanday', label: 'Qanday ishlaydi' },
  { href: '#imkoniyatlar', label: 'Imkoniyatlar' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-300 ${scrolled ? 'bg-dark-900/85 backdrop-blur-xl border-b border-white/[0.06]' : ''}`}>
      <Container>
        <div className="flex items-center justify-between h-[72px]">
          <a href="/" className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-tight">
            <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
              <IconSchool size={20} />
            </div>
            <span className="bg-gradient-to-br from-slate-50 to-slate-300 bg-clip-text text-transparent">TestFull</span>
          </a>

          <ul className="hidden md:flex items-center gap-2">
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-white/5 transition-all">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <LinkButton href={BOT_URL} target="_blank" rel="noopener noreferrer">
              <IconBrandTelegram size={18} /> Boshlash
            </LinkButton>
            <button className="md:hidden text-slate-200 p-2" onClick={() => setOpen(!open)}>
              {open ? <IconX size={24} /> : <IconMenu2 size={24} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-1">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-white/5 transition-all">
                {l.label}
              </a>
            ))}
          </div>
        )}
      </Container>
    </nav>
  )
}
