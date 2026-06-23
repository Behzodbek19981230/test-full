'use client';

import { useRouter } from 'next/navigation';
import { IconClipboardCheck, IconArrowRight } from '@tabler/icons-react';
import { Container, SubjectIcon } from '../ui';
import { useAuth } from '@/context/AuthContext';
import { useInView } from '@/hooks/useInView';

interface Subject {
	id: number;
	name: string;
	icon: string;
	mandatory_question_count: number;
}

export default function MandatoryBlock({ subjects }: { subjects: Subject[] }) {
	const { ref, inView } = useInView(0.2);
	const { user } = useAuth();
	const router = useRouter();

	const totalQuestions = subjects.reduce((s, f) => s + f.mandatory_question_count, 0);

	const handleStart = () => {
		if (!user) {
			router.push('/login?redirect=quiz&subject=mandatory');
			return;
		}
		router.push('/quiz/mandatory');
	};

	return (
		<section className='py-16 sm:py-24 bg-white' id='majburiy'>
			<Container>
				<div
					ref={ref}
					className={`animate-on-scroll anim-fade-up ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<div className='max-w-2xl mx-auto'>
						<div className='border border-primary/20 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-primary/[0.03] to-transparent'>
							{/* Header */}
							<div className='p-5 sm:p-7 pb-0 sm:pb-0'>
								<div className='inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-[12px] sm:text-[13px] font-semibold text-primary mb-4'>
									<IconClipboardCheck size={15} />
									DTM standart
								</div>
								<h2 className='text-[22px] sm:text-[28px] font-extrabold text-slate-900 mb-2 tracking-tight'>
									Majburiy fanlar bloki
								</h2>
								<p className='text-[14px] sm:text-[15px] text-slate-500 leading-relaxed'>
									DTM standartidagi {totalQuestions} ta savoldan iborat test varianti
								</p>
							</div>

							{/* Subjects */}
							<div className='p-5 sm:p-7 flex flex-col gap-3'>
								{subjects.map((s) => (
									<div
										key={s.id}
										className='flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200'
									>
										<div className='w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0'>
											<SubjectIcon icon={s.icon} size={24} />
										</div>
										<div className='flex-1 min-w-0'>
											<div className='text-[14px] sm:text-[15px] font-bold text-slate-900'>
												{s.name}
											</div>
										</div>
										<div className='text-[13px] font-semibold text-primary shrink-0'>
											{s.mandatory_question_count} ta
										</div>
									</div>
								))}

								<div className='flex items-center justify-between pt-2 px-1'>
									<span className='text-[13px] sm:text-sm text-slate-400'>
										Jami: <strong className='text-slate-700'>{totalQuestions} ta savol</strong>
									</span>
									<span className='text-[13px] sm:text-sm text-slate-400'>
										Vaqt:{' '}
										<strong className='text-slate-700'>
											{Math.ceil(totalQuestions * 1.5)} daqiqa
										</strong>
									</span>
								</div>
							</div>

							{/* CTA */}
							<div className='px-5 sm:px-7 pb-5 sm:pb-7'>
								<button
									onClick={handleStart}
									className='w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold text-[15px] shadow-[0_2px_12px_rgba(26,127,138,0.3)] hover:bg-primary-dark active:scale-[0.98] transition-all'
								>
									Testni boshlash <IconArrowRight size={18} />
								</button>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}
