'use client';

import { IconDeviceMobile, IconBolt, IconChartBar, IconTarget, IconCreditCard, IconBooks } from '@tabler/icons-react';
import { Container, SectionHeader } from '../ui';
import { useInView } from '@/hooks/useInView';

const features = [
  { icon: IconDeviceMobile, color: 'bg-primary/[0.12] text-primary-light', title: 'Telegram Bot', desc: 'Qulay bot orqali istalgan vaqtda, istalgan joyda test ishlang' },
  { icon: IconBolt, color: 'bg-secondary/[0.12] text-secondary', title: 'Tezkor Tekshirish', desc: 'Javoblaringiz bir zumda tekshiriladi va batafsil natija ko\'rsatiladi' },
  { icon: IconChartBar, color: 'bg-success/[0.12] text-success', title: 'Batafsil Tahlil', desc: 'Har bir savol bo\'yicha to\'g\'ri va noto\'g\'ri javoblar tahlili' },
  { icon: IconTarget, color: 'bg-accent/[0.12] text-accent', title: 'DTM Formati', desc: 'Haqiqiy DTM va attestatsiya formatida professional testlar' },
  { icon: IconCreditCard, color: 'bg-rose-500/[0.12] text-rose-400', title: 'Oson To\'lov', desc: 'Plastik karta orqali qulay va xavfsiz to\'lov tizimi' },
  { icon: IconBooks, color: 'bg-blue-500/[0.12] text-blue-400', title: 'Ko\'p Fanlar', desc: 'Barcha DTM fanlari bo\'yicha doimiy yangilanib turadigan testlar' },
]

export default function Features() {
  const { ref: headerRef, inView: headerInView } = useInView(0.2);
  const { ref: gridRef, inView: gridInView } = useInView(0.1);

  return (
    <section className="py-16 sm:py-24" id="imkoniyatlar">
      <Container>
        <div
          ref={headerRef}
          className={`animate-on-scroll anim-fade-up ${headerInView ? 'in-view' : ''}`}
          style={{ animationDuration: '0.7s' }}
        >
          <SectionHeader
            label={<><IconTarget size={16} /> Imkoniyatlar</>}
            title="Nima Uchun Test Market?"
            desc="Eng qulay va samarali tayyorlanish muhitini taqdim etamiz"
          />
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`animate-on-scroll anim-fade-up bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 ${gridInView ? 'in-view' : ''}`}
              style={{ animationDuration: '0.6s', animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 ${f.color}`}>
                <f.icon size={22} className="sm:hidden" />
                <f.icon size={26} className="hidden sm:block" />
              </div>
              <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-900 mb-1.5 sm:mb-2">{f.title}</h3>
              <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
