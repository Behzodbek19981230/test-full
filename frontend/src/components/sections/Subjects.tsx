import { IconBooks, IconBrandTelegram } from '@tabler/icons-react'
import { Container, SectionHeader, SubjectIcon } from '../ui'

const BOT_URL = 'https://t.me/test_market_uzbot'

interface Subject {
  id: number; name: string; icon: string; price_per_question: number; question_count: number
}

export default function Subjects({ subjects }: { subjects: Subject[] }) {
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
            <a key={s.id} href={BOT_URL} target="_blank" rel="noopener noreferrer"
              className="group bg-dark-800 border border-white/[0.06] rounded-2xl p-6 text-center flex flex-col items-center transition-all duration-300 hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-20 h-20 rounded-2xl bg-primary/[0.08] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <SubjectIcon icon={s.icon} size={48} />
              </div>
              <h3 className="relative text-base font-bold text-slate-50 mb-2 leading-snug">{s.name}</h3>
              <div className="relative flex flex-col items-center gap-1 text-[13px] text-slate-500">
                <span>{s.question_count} savol</span>
                <span className="font-semibold text-accent">{s.price_per_question.toLocaleString()} so&apos;m/test</span>
              </div>
            </a>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500">
              <IconBooks size={48} className="mx-auto mb-3 opacity-25" />
              <p>Fanlar yuklanmoqda...</p>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
