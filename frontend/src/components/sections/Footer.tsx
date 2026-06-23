'use client';

import { IconBrandTelegram, IconPhone } from '@tabler/icons-react';
import { Container } from '../ui';
import { useInView } from '@/hooks/useInView';

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`;

export default function Footer() {
	const { ref, inView } = useInView(0.3);

	return (
		<footer className='py-10 border-t border-slate-200'>
			<Container>
				<div
					ref={ref}
					className={`animate-on-scroll anim-fade-up ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.6s' }}
				>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4'>
						<span className='text-sm text-slate-500'>
							&copy; 2026 Test Market. Barcha huquqlar himoyalangan.
						</span>

						<div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
							<a
								href='https://t.me/Behzodbek1230'
								target='_blank'
								rel='noopener noreferrer'
								className='flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2AABEE] transition-colors'
							>
								<IconBrandTelegram size={16} /> @Behzodbek1230
							</a>
							<a
								href='tel:+998930013098'
								className='flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors'
							>
								<IconPhone size={16} /> +998 93 001 30 98
							</a>
							<a
								href={BOT_URL}
								target='_blank'
								rel='noopener noreferrer'
								className='text-sm text-slate-500 hover:text-slate-900 transition-colors'
							>
								Telegram Bot
							</a>
							<a href='#fanlar' className='text-sm text-slate-500 hover:text-slate-900 transition-colors'>
								Fanlar
							</a>
						</div>
					</div>
				</div>
			</Container>
		</footer>
	);
}
