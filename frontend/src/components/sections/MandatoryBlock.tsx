'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconClipboardCheck, IconArrowRight, IconDeviceDesktop, IconBrandTelegram, IconX } from '@tabler/icons-react';
import { Container, SubjectIcon } from '../ui';
import { useInView } from '@/hooks/useInView';

const BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';

interface Subject {
	id: number;
	name: string;
	icon: string;
	mandatory_question_count: number;
}

const CARD_COLORS = [
	'from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40',
	'from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/40',
	'from-success/10 to-success/5 border-success/20 hover:border-success/40',
];

export default function MandatoryBlock({ subjects }: { subjects: Subject[] }) {
	const { ref: headerRef, inView: headerInView } = useInView(0.2);
	const { ref: gridRef, inView: gridInView } = useInView(0.1);
	const router = useRouter();
	const [selected, setSelected] = useState<Subject | null>(null);

	if (subjects.length === 0) return null;

	const totalQuestions = subjects.reduce((s, f) => s + f.mandatory_question_count, 0);

	return (
		<section className='py-16 sm:py-28 relative overflow-hidden bg-white' id='majburiy'>
			<div className='absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-white' />
			<div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(212,132,42,0.04)_0%,transparent_70%)]' />

			<Container className='relative z-10'>
				<div
					ref={headerRef}
					className={`animate-on-scroll anim-fade-up text-center mb-10 sm:mb-16 ${headerInView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<div className='inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary/10 border border-secondary/20 rounded-full text-[12px] sm:text-[13px] font-semibold text-secondary mb-4 sm:mb-5'>
						<IconClipboardCheck size={15} />
						DTM standart
					</div>
					<h2 className='text-[28px] sm:text-[36px] lg:text-[42px] font-extrabold tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight'>
						Majburiy fanlar bloki
					</h2>
				</div>

				<div ref={gridRef} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
					{subjects.map((s, i) => (
						<button
							key={s.id}
							onClick={() => setSelected(s)}
							className={`animate-on-scroll anim-scale-in group relative bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer active:scale-[0.98] ${gridInView ? 'in-view' : ''}`}
							style={{ animationDuration: '0.5s', animationDelay: `${i * 0.1}s` }}
						>
							<div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/80 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform'>
								<SubjectIcon icon={s.icon} size={28} />
							</div>
							<div className='flex-1 min-w-0'>
								<h3 className='text-[14px] sm:text-[15px] font-bold text-slate-900 mb-0.5'>{s.name}</h3>
								<p className='text-[12px] sm:text-[13px] text-slate-500'>
									{s.mandatory_question_count} ta savol
								</p>
							</div>
							<div className='w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/60 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-white transition-all shrink-0'>
								<IconArrowRight size={15} />
							</div>
						</button>
					))}
				</div>

				{/* Summary */}
			</Container>

			{/* Mode selection modal */}
			{selected && (
				<div
					className='fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm'
					onClick={() => setSelected(null)}
				>
					<div
						className='bg-white border-t sm:border border-slate-200 shadow-2xl rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-0 animate-[slideUp_0.25s_ease-out]'
						onClick={(e) => e.stopPropagation()}
					>
						<div className='sm:hidden flex justify-center pt-3 pb-1'>
							<div className='w-10 h-1 rounded-full bg-slate-300' />
						</div>

						<div className='flex items-center justify-between p-4 sm:p-5 border-b border-slate-200'>
							<div className='flex items-center gap-3'>
								<SubjectIcon icon={selected.icon} size={28} />
								<div>
									<h3 className='text-base sm:text-lg font-bold text-slate-900'>{selected.name}</h3>
									<p className='text-[13px] sm:text-sm text-slate-500'>
										{selected.mandatory_question_count} ta savol
									</p>
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
								onClick={() => {
									setSelected(null);
									router.push(`/quiz/${selected.id}?count=${selected.mandatory_question_count}`);
								}}
								className='w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-primary/30 hover:bg-primary/[0.04] transition-all group text-left active:scale-[0.98]'
							>
								<div className='w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-light group-hover:scale-110 transition-transform'>
									<IconDeviceDesktop size={22} />
								</div>
								<div className='flex-1'>
									<h4 className='text-[14px] sm:text-[15px] font-bold text-slate-900'>Online test</h4>
									<p className='text-[12px] sm:text-[13px] text-slate-500'>
										{selected.mandatory_question_count} ta savol · Natija shu yerda
									</p>
								</div>
								<span className='text-slate-400 group-hover:text-primary-light transition-colors'>
									→
								</span>
							</button>

							<button
								onClick={() => {
									setSelected(null);
									window.open(`https://t.me/${BOT_NAME}?start=sub_${selected.id}`, '_blank');
								}}
								className='w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-secondary/30 hover:bg-secondary/[0.04] transition-all group text-left active:scale-[0.98]'
							>
								<div className='w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform'>
									<IconBrandTelegram size={22} />
								</div>
								<div className='flex-1'>
									<h4 className='text-[14px] sm:text-[15px] font-bold text-slate-900'>
										Bot orqali yechaman
									</h4>
									<p className='text-[12px] sm:text-[13px] text-slate-500'>Telegram bot orqali</p>
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
