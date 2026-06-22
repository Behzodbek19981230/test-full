import { IconBooks, IconCreditCard, IconClipboardCheck, IconChartBar, IconBolt } from '@tabler/icons-react'
import { Container, SectionHeader } from '../ui'

const steps = [
  { icon: IconBooks, title: 'Fanni Tanlang', desc: 'Saytda yoki botda kerakli fan va testni ko\'ring' },
  { icon: IconCreditCard, title: 'To\'lov Qiling', desc: 'Karta orqali to\'lab chek screenshotini yuboring' },
  { icon: IconClipboardCheck, title: 'Testni Ishlang', desc: 'Telegram bot orqali qulay interfeys bilan ishlang' },
  { icon: IconChartBar, title: 'Natijani Ko\'ring', desc: 'Har bir javobingiz tahlili bilan natijani oling' },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white" id="qanday">
      <Container>
        <SectionHeader
          label={<><IconBolt size={16} /> Jarayon</>}
          title="Qanday Ishlaydi?"
          desc="4 ta oddiy qadamda testni ishlashni boshlang"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-9 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((s, i) => (
            <div key={i} className="text-center relative group">
              <div className="w-[72px] h-[72px] rounded-full bg-white shadow-sm border-2 border-primary/20 flex items-center justify-center mx-auto mb-5 relative z-10 transition-all group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(26,127,138,0.2)]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white">
                  <s.icon size={24} />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-[220px] mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
