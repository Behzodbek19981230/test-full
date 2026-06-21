'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IconSchool, IconMenu2, IconX, IconLogin, IconLogout } from '@tabler/icons-react'
import { Container } from '../ui'
import { useAuth } from '@/context/AuthContext'

const links = [
  { href: '#fanlar', label: 'Fanlar' },
  { href: '#qanday', label: 'Qanday ishlaydi' },
  { href: '#imkoniyatlar', label: 'Imkoniyatlar' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user, loading, logout } = useAuth()

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
            <span className="bg-gradient-to-br from-slate-50 to-slate-300 bg-clip-text text-transparent">Test Market</span>
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
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {user.full_name.charAt(0)}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-slate-200 max-w-[120px] truncate">
                      {user.full_name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Chiqish"
                  >
                    <IconLogout size={18} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all"
                >
                  <IconLogin size={16} /> Kirish
                </Link>
              )
            )}
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
