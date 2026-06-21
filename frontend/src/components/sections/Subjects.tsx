'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconBooks, IconBrandTelegram, IconDeviceDesktop, IconX } from '@tabler/icons-react'
import { Container, SectionHeader, SubjectIcon } from '../ui'

const BOT_URL = 'https://t.me/test_market_uzbot'

interface Subject {
  id: number
  name: string
  icon: string
  price_per_question: number
  question_count: number
}

export default function Subjects({ subjects }: { subjects: Subject[] }) {
  const [selected, setSelected] = useState<Subject | null>(null)

  return (
    <section className="py-24" id="fanlar">
      <Container>
        <SectionHeader
          label={<><IconBooks size={16} /> Fanlar</>}
          title="Fanlar va Testlar"
          desc="DTM va attestatsiya uchun barcha fanlar bo'yicha professional testlar"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="group bg-dark-800 border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] relative overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <SubjectIcon icon={s.icon} size={48} />
              <h3 className="relative text-base font-bold text-slate-50 mb-2 leading-snug">{s.name}</h3>
              <div className="relative flex flex-col items-center gap-1 text-[13px] text-slate-500">
                <span>{s.question_count} savol</span>
              </div>
            </button>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500">
              <IconBooks size={48} className="mx-auto mb-3 opacity-25" />
              <p>Fanlar yuklanmoqda...</p>
            </div>
          )}
        </div>
      </Container>

      {/* Mode selection modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-dark-800 border border-white/[0.06] rounded-3xl w-full max-w-md p-0 animate-[slideUp_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <SubjectIcon icon={selected.icon} size={32} />
                <div>
                  <h3 className="text-lg font-bold text-slate-50">{selected.name}</h3>
                  <p className="text-sm text-slate-500">{selected.question_count} savol mavjud</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-100 hover:bg-white/5 transition-all">
                <IconX size={18} />
              </button>
            </div>

            {/* Options */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-400 mb-4">Qanday formatda test ishlashni tanlang:</p>

              {/* Online test */}
              <Link
                href={`/quiz/${selected.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/30 hover:bg-primary/[0.04] transition-all group"
                onClick={() => setSelected(null)}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light group-hover:scale-110 transition-transform">
                  <IconDeviceDesktop size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-slate-50">Online test</h4>
                  <p className="text-[13px] text-slate-500">30 ta savol · 45 daqiqa · Natija shu yerda</p>
                </div>
                <span className="text-slate-600 group-hover:text-primary-light transition-colors">→</span>
              </Link>

              {/* Bot orqali */}
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-secondary/30 hover:bg-secondary/[0.04] transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <IconBrandTelegram size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-slate-50">Qog&apos;oz variant (Bot)</h4>
                  <p className="text-[13px] text-slate-500">Telegram bot orqali · PDF yuklab olish</p>
                </div>
                <span className="text-slate-600 group-hover:text-secondary transition-colors">→</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
