import { IconDeviceMobile, IconBolt, IconChartBar, IconTarget, IconCreditCard, IconBooks } from '@tabler/icons-react'
import { Container, SectionHeader } from '../ui'

const features = [
  { icon: IconDeviceMobile, color: 'bg-primary/[0.12] text-primary-light', title: 'Telegram Bot', desc: 'Qulay bot orqali istalgan vaqtda, istalgan joyda test ishlang' },
  { icon: IconBolt, color: 'bg-secondary/[0.12] text-secondary', title: 'Tezkor Tekshirish', desc: 'Javoblaringiz bir zumda tekshiriladi va batafsil natija ko\'rsatiladi' },
  { icon: IconChartBar, color: 'bg-success/[0.12] text-success', title: 'Batafsil Tahlil', desc: 'Har bir savol bo\'yicha to\'g\'ri va noto\'g\'ri javoblar tahlili' },
  { icon: IconTarget, color: 'bg-accent/[0.12] text-accent', title: 'DTM Formati', desc: 'Haqiqiy DTM va attestatsiya formatida professional testlar' },
  { icon: IconCreditCard, color: 'bg-rose-500/[0.12] text-rose-400', title: 'Oson To\'lov', desc: 'Plastik karta orqali qulay va xavfsiz to\'lov tizimi' },
  { icon: IconBooks, color: 'bg-blue-500/[0.12] text-blue-400', title: 'Ko\'p Fanlar', desc: 'Barcha DTM fanlari bo\'yicha doimiy yangilanib turadigan testlar' },
]

export default function Features() {
  return (
    <section className="py-24" id="imkoniyatlar">
      <Container>
        <SectionHeader
          label={<><IconTarget size={16} /> Imkoniyatlar</>}
          title="Nima Uchun Test Market?"
          desc="Eng qulay va samarali tayyorlanish muhitini taqdim etamiz"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5">
              <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 ${f.color}`}>
                <f.icon size={26} />
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
