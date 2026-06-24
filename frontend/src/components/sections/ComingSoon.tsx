'use client';

import {
	IconRocket,
	IconBrandTelegram,
	IconClock,
	IconChartBar,
	IconWorld,
	IconMathSymbols,
	IconBrain,
	IconVocabulary,
	IconPencil,
} from '@tabler/icons-react';
import { Container } from '../ui';
import { useInView } from '@/hooks/useInView';

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`;

const exams = [
	{
		name: 'GMAT',
		fullName: 'Graduate Management Admission Test',
		desc: 'MBA va magistratura dasturlariga kirish uchun xalqaro imtihon. Biznesga yo\'naltirilgan testlar bilan tayyorlaning.',
		gradient: 'from-indigo-600 to-blue-500',
		bgGlow: 'bg-indigo-500/10',
		borderColor: 'border-indigo-200 hover:border-indigo-300',
		iconBg: 'bg-indigo-500/10 text-indigo-500',
		sections: [
			{ icon: IconMathSymbols, label: 'Quantitative', desc: 'Matematika va analitik masalalar' },
			{ icon: IconVocabulary, label: 'Verbal', desc: 'Reading comprehension & tushunish' },
			{ icon: IconBrain, label: 'Data Insights', desc: 'Ma\'lumotlarni tahlil qilish' },
		],
	},
	{
		name: 'GRE',
		fullName: 'Graduate Record Examination',
		desc: 'Magistratura va doktoranturaga kirish uchun umumiy imtihon. Dunyoning top universitetlariga yo\'l oching.',
		gradient: 'from-emerald-600 to-teal-500',
		bgGlow: 'bg-emerald-500/10',
		borderColor: 'border-emerald-200 hover:border-emerald-300',
		iconBg: 'bg-emerald-500/10 text-emerald-500',
		sections: [
			{ icon: IconPencil, label: 'Verbal Reasoning', desc: 'Matn tahlili va lug\'at' },
			{ icon: IconMathSymbols, label: 'Quantitative', desc: 'Matematika va statistika' },
			{ icon: IconBrain, label: 'Analytical Writing', desc: 'Analitik yozuv ko\'nikmalari' },
		],
	},
];

export default function ComingSoon() {
	const { ref: headerRef, inView: headerInView } = useInView(0.2);
	const { ref: cardsRef, inView: cardsInView } = useInView(0.1);

	return (
		<section className='py-16 sm:py-28 relative overflow-hidden' id='gmat-gre'>
			<div className='absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white' />
			<div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.04)_0%,transparent_60%)]' />

			<Container className='relative z-10'>
				<div
					ref={headerRef}
					className={`animate-on-scroll anim-fade-up text-center mb-10 sm:mb-16 ${headerInView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<div className='inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-200/50 rounded-full text-[12px] sm:text-[13px] font-semibold text-indigo-600 mb-4 sm:mb-5'>
						<IconRocket size={15} />
						Tez kunda
					</div>
					<h2 className='text-[28px] sm:text-[36px] lg:text-[42px] font-extrabold tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight'>
						GMAT & GRE Testlari
					</h2>
					<p className='text-[15px] sm:text-[17px] text-slate-500 max-w-[560px] mx-auto leading-relaxed'>
						Xalqaro imtihonlarga tayyorlanish imkoniyati tez orada platformamizda ishga tushadi
					</p>
				</div>

				<div ref={cardsRef} className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto'>
					{exams.map((exam, i) => (
						<div
							key={exam.name}
							className={`animate-on-scroll anim-fade-up group relative bg-white border ${exam.borderColor} rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${cardsInView ? 'in-view' : ''}`}
							style={{ animationDuration: '0.6s', animationDelay: `${i * 0.15}s` }}
						>
							{/* Top gradient bar */}
							<div className={`h-1.5 bg-gradient-to-r ${exam.gradient}`} />

							<div className='p-5 sm:p-7'>
								{/* Header */}
								<div className='flex items-start gap-4 mb-5 sm:mb-6'>
									<div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${exam.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
										<IconWorld size={28} className='sm:hidden' />
										<IconWorld size={32} className='hidden sm:block' />
									</div>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2 mb-1'>
											<h3 className='text-[22px] sm:text-[26px] font-extrabold tracking-tight text-slate-900'>
												{exam.name}
											</h3>
											<span className='px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider'>
												Tez kunda
											</span>
										</div>
										<p className='text-[12px] sm:text-[13px] text-slate-400 font-medium'>
											{exam.fullName}
										</p>
									</div>
								</div>

								{/* Description */}
								<p className='text-[13px] sm:text-[14px] text-slate-600 leading-relaxed mb-5 sm:mb-6'>
									{exam.desc}
								</p>

								{/* Sections */}
								<div className='space-y-2.5 sm:space-y-3 mb-5 sm:mb-6'>
									{exam.sections.map((s) => (
										<div
											key={s.label}
											className='flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-slate-50/80 transition-colors'
										>
											<div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${exam.iconBg} flex items-center justify-center shrink-0`}>
												<s.icon size={18} />
											</div>
											<div className='flex-1 min-w-0'>
												<p className='text-[13px] sm:text-[14px] font-semibold text-slate-800'>
													{s.label}
												</p>
												<p className='text-[11px] sm:text-[12px] text-slate-400'>
													{s.desc}
												</p>
											</div>
										</div>
									))}
								</div>

								{/* Timer countdown feel */}
								<div className='flex items-center gap-2 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/60'>
									<div className='w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600'>
										<IconClock size={16} />
									</div>
									<div className='flex-1'>
										<p className='text-[12px] sm:text-[13px] font-semibold text-slate-700'>
											Ishga tushish vaqti yaqinlashmoqda
										</p>
										<p className='text-[11px] text-slate-400'>
											Birinchilardan bo'lish uchun obuna bo'ling
										</p>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* CTA button */}
				<div
					className={`animate-on-scroll anim-fade-up flex flex-col items-center mt-8 sm:mt-12 ${cardsInView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.6s', animationDelay: '0.3s' }}
				>
					<a
						href={BOT_URL}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-blue-500 text-white text-[14px] sm:text-[15px] font-semibold rounded-2xl shadow-[0_4px_16px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]'
					>
						<IconBrandTelegram size={20} />
						Xabardor bo'lish
					</a>
					<p className='text-[12px] sm:text-[13px] text-slate-400 mt-3'>
						<IconChartBar size={14} className='inline mr-1 -mt-0.5' />
						1000+ talaba allaqachon kutmoqda
					</p>
				</div>
			</Container>
		</section>
	);
}
