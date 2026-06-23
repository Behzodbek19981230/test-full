'use client';

import { useEffect, useState } from 'react';
import { IconUsers, IconClipboardCheck, IconChartBar, IconBooks } from '@tabler/icons-react';
import { Container } from '../ui';
import { useInView } from '@/hooks/useInView';

interface Props {
  stats: { total_users: number; total_questions: number; total_attempts: number; total_subjects: number }
}

const items = [
  { icon: IconUsers, color: 'text-primary-light bg-primary/[0.08]', key: 'total_users' as const, fallback: 500, label: 'Foydalanuvchilar' },
  { icon: IconClipboardCheck, color: 'text-secondary bg-secondary/10', key: 'total_questions' as const, fallback: 500, label: 'Savollar' },
  { icon: IconChartBar, color: 'text-success bg-success/10', key: 'total_attempts' as const, fallback: 2500, label: 'Ishlangan testlar' },
  { icon: IconBooks, color: 'text-accent bg-accent/10', key: 'total_subjects' as const, fallback: 12, label: 'Fanlar' },
]

function AnimatedCounter({ target, started }: { target: number; started: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started || target === 0) return;
    let frame: number;
    const duration = 1800;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, started]);

  return <>{(started ? count : 0).toLocaleString()}+</>;
}

export default function Stats({ stats }: Props) {
  const { ref, inView } = useInView(0.3);

  return (
    <section className="py-10 sm:py-16 border-y border-slate-200 bg-white">
      <Container>
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-0">
          {items.map((s, i) => (
            <div
              key={i}
              className={`animate-on-scroll anim-fade-up text-center py-4 sm:py-6 relative ${inView ? 'in-view' : ''}`}
              style={{ animationDuration: '0.7s', animationDelay: `${i * 0.12}s` }}
            >
              {i < items.length - 1 && <div className="hidden lg:block absolute right-0 top-[20%] h-[60%] w-px bg-slate-200" />}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 ${s.color}`}>
                <s.icon size={22} className="sm:hidden" />
                <s.icon size={24} className="hidden sm:block" />
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                <AnimatedCounter target={stats[s.key] || s.fallback} started={inView} />
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
