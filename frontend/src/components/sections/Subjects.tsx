'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconBooks, IconBrandTelegram, IconDeviceDesktop, IconX, IconArrowRight } from '@tabler/icons-react';
import { Container, SubjectIcon } from '../ui';
import { useAuth } from '@/context/AuthContext';
import { useInView } from '@/hooks/useInView';
import { buildSubjectSlug } from '@/lib/slug';

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';

const CARD_COLORS = [
	'from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40',
	'from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/40',
	'from-success/10 to-success/5 border-success/20 hover:border-success/40',
	'from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40',
	'from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/40',
	'from-rose-500/10 to-rose-500/5 border-rose-500/20 hover:border-rose-500/40',
	'from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
	'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
	'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40',
	'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40',
];

interface Subject {
	id: number;
	name: string;
	icon: string;
	price_per_question: number;
	question_count: number;
	description: string;
	is_mandatory?: boolean;
}

export default function Subjects({ subjects }: { subjects: Subject[] }) {
	const [selected, setSelected] = useState<Subject | null>(null);
	const { user } = useAuth();
	const router = useRouter();
	const { ref: headerRef, inView: headerInView } = useInView(0.2);
	const { ref: gridRef, inView: gridInView } = useInView(0.1);

	const handleOnlineClick = (subject: Subject) => {
		setSelected(null);
		router.push(`/quiz/${buildSubjectSlug(subject.id, subject.name)}`);
	};

	const handleBotClick = (subjectId: number) => {
		setSelected(null);
		if (!user) {
			router.push(`/login?redirect=bot&subject=${subjectId}`);
			return;
		}
		window.open(`https://t.me/${BOT_NAME}?start=sub_${subjectId}`, '_blank');
	};

	return (
		<section className='py-16 sm:py-28 relative overflow-hidden' id='fanlar'>
			{/* Decorative bg */}
			<div className='absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50' />
			<div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(26,127,138,0.04)_0%,transparent_70%)]' />

			<Container className='relative z-10'>
				<div
					ref={headerRef}
					className={`animate-on-scroll anim-fade-up text-center mb-10 sm:mb-16 ${headerInView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<div className='inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/[0.08] border border-primary/20 rounded-full text-[12px] sm:text-[13px] font-semibold text-primary mb-4 sm:mb-5'>
						<IconBooks size={15} />
						Barcha fanlar bir joyda
					</div>
					<h2 className='text-[28px] sm:text-[36px] lg:text-[42px] font-extrabold tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight'>
						Fanlar va Testlar
					</h2>
					<p className='text-[15px] sm:text-[17px] text-slate-500 max-w-[520px] mx-auto leading-relaxed'>
						O&apos;zingizga kerakli fanni tanlang va hoziroq test ishlashni boshlang
					</p>
				</div>

				<div ref={gridRef} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
					{subjects.filter(s => !s.is_mandatory).map((s, i) => (
						<button
							key={s.id}
							onClick={() => setSelected(s)}
							className={`animate-on-scroll anim-scale-in group relative bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer active:scale-[0.98] ${gridInView ? 'in-view' : ''}`}
							style={{ animationDuration: '0.5s', animationDelay: `${Math.min(i * 0.06, 0.6)}s` }}
						>
							<div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/80 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
								<SubjectIcon icon={s.icon} size={28} />
							</div>
							<div className='flex-1 min-w-0'>
								<h3 className='text-[14px] sm:text-[15px] font-bold text-slate-900 mb-0.5 truncate'>
									{s.name}
								</h3>
								<p className='text-[12px] sm:text-[13px] text-slate-500 line-clamp-1'>
									{s.description}
								</p>
							</div>
							<div className='w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/60 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white transition-all shrink-0'>
								<IconArrowRight size={15} />
							</div>
						</button>
					))}

					{subjects.length === 0 && (
						<div className='col-span-full text-center py-16 sm:py-20 text-slate-400'>
							<IconBooks size={40} className='mx-auto mb-3 opacity-25' />
							<p className='text-sm'>Fanlar yuklanmoqda...</p>
						</div>
					)}
				</div>
			</Container>

			{/* Mode selection modal — bottom sheet on mobile */}
			{selected && (
				<div
					className='fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm'
					onClick={() => setSelected(null)}
				>
					<div
						className='bg-white border-t sm:border border-slate-200 shadow-2xl rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-0 animate-[slideUp_0.25s_ease-out]'
						onClick={(e) => e.stopPropagation()}
					>
						{/* Drag handle on mobile */}
						<div className='sm:hidden flex justify-center pt-3 pb-1'>
							<div className='w-10 h-1 rounded-full bg-slate-300' />
						</div>

						<div className='flex items-center justify-between p-4 sm:p-5 border-b border-slate-200'>
							<div className='flex items-center gap-3'>
								<SubjectIcon icon={selected.icon} size={28} />
								<div>
									<h3 className='text-base sm:text-lg font-bold text-slate-900'>{selected.name}</h3>
								</div>
							</div>
							<button
								onClick={() => setSelected(null)}
								className='w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all'
							>
								<IconX size={18} />
							</button>
						</div>

						<div className='p-4 sm:p-5 space-y-3 pb-6 sm:pb-5'>
							<p className='text-[13px] sm:text-sm text-slate-400 mb-3 sm:mb-4'>
								Qanday formatda test ishlashni tanlang:
							</p>

							<button
								onClick={() => handleOnlineClick(selected)}
								className='w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-primary/30 hover:bg-primary/[0.04] transition-all group text-left active:scale-[0.98]'
							>
								<div className='w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light group-hover:scale-110 transition-transform'>
									<IconDeviceDesktop size={22} />
								</div>
								<div className='flex-1'>
									<h4 className='text-[14px] sm:text-[15px] font-bold text-slate-900'>Online test</h4>
									<p className='text-[12px] sm:text-[13px] text-slate-500'>
										30 ta savol · 45 daqiqa · Natija shu yerda
									</p>
								</div>
								<span className='text-slate-400 group-hover:text-primary-light transition-colors'>
									→
								</span>
							</button>

							<button
								onClick={() => handleBotClick(selected.id)}
								className='w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-secondary/30 hover:bg-secondary/[0.04] transition-all group text-left active:scale-[0.98]'
							>
								<div className='w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform'>
									<IconBrandTelegram size={22} />
								</div>
								<div className='flex-1'>
									<h4 className='text-[14px] sm:text-[15px] font-bold text-slate-900'>
										Bot orqali yechaman
									</h4>
									<p className='text-[12px] sm:text-[13px] text-slate-500'>
										{user ? 'Telegram bot orqali · PDF yuklab olish' : 'Avval tizimga kiring'}
									</p>
								</div>
								<span className='text-slate-400 group-hover:text-secondary transition-colors'>→</span>
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
