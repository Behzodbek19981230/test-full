'use client';

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
					className={`animate-on-scroll anim-fade-up flex flex-col sm:flex-row justify-between items-center gap-4 ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.6s' }}
				>
					<span className='text-sm text-slate-500'>
						&copy; 2026 Test Market. Barcha huquqlar himoyalangan.
					</span>
					<div className='flex gap-6'>
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
						<a
							href='#imkoniyatlar'
							className='text-sm text-slate-500 hover:text-slate-900 transition-colors'
						>
							Imkoniyatlar
						</a>
					</div>
				</div>
			</Container>
		</footer>
	);
}
