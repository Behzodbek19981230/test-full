'use client';

import { IconBrandTelegram, IconPhone } from '@tabler/icons-react';
import { Container } from '../ui';
import { useInView } from '@/hooks/useInView';

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`;

const quickLinks = [
	{ href: '#fanlar', label: 'Fanlar' },
	{ href: '#majburiy', label: 'Majburiy fanlar' },
	{ href: '#qanday', label: 'Qanday ishlaydi' },
	{ href: '#faq', label: 'Savollar' },
];

export default function Footer() {
	const { ref, inView } = useInView(0.3);

	return (
		<footer className='py-12 sm:py-16 border-t border-slate-200 bg-slate-50'>
			<Container>
				<div
					ref={ref}
					className={`animate-on-scroll anim-fade-up ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.6s' }}
				>
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 mb-10'>
						<div>
							<a href='/' className='inline-flex items-center gap-2 mb-3'>
								<img src='/icon.png' alt='Test Market' className='w-8 h-8 rounded-lg object-contain' />
								<span className='text-[17px] font-bold tracking-[-0.5px]'>
									<span className='text-slate-800'>Test</span>
									<span className='bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent'>
										Market
									</span>
								</span>
							</a>
							<p className='text-sm text-slate-500 leading-relaxed max-w-[280px]'>
								DTM va attestatsiyaga mukammal tayyorlanish uchun testlar platformasi.
							</p>
						</div>

						<div>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3'>
								Havolalar
							</h4>
							<ul className='space-y-2'>
								{quickLinks.map((l) => (
									<li key={l.href}>
										<a href={l.href} className='text-sm text-slate-600 hover:text-slate-900 transition-colors'>
											{l.label}
										</a>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3'>
								Aloqa
							</h4>
							<ul className='space-y-2'>
								<li>
									<a
										href={BOT_URL}
										target='_blank'
										rel='noopener noreferrer'
										className='flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#2AABEE] transition-colors'
									>
										<IconBrandTelegram size={16} /> Telegram Bot
									</a>
								</li>
								<li>
									<a
										href='https://t.me/Behzodbek1230'
										target='_blank'
										rel='noopener noreferrer'
										className='flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#2AABEE] transition-colors'
									>
										<IconBrandTelegram size={16} /> @Behzodbek1230
									</a>
								</li>
								<li>
									<a
										href='tel:+998930013098'
										className='flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors'
									>
										<IconPhone size={16} /> +998 93 001 30 98
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className='pt-6 border-t border-slate-200'>
						<span className='text-sm text-slate-500'>
							&copy; 2026 Test Market. Barcha huquqlar himoyalangan.
						</span>
					</div>
				</div>
			</Container>
		</footer>
	);
}
