'use client';

import { IconBrandTelegram } from '@tabler/icons-react';
import { Container, LinkButton } from '../ui';
import { useInView } from '@/hooks/useInView';

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`;

export default function CTA() {
	const { ref, inView } = useInView(0.2);

	return (
		<section className='py-16 sm:py-24'>
			<Container>
				<div
					ref={ref}
					className={`animate-on-scroll anim-scale-in relative bg-gradient-to-br from-primary to-primary-dark rounded-2xl sm:rounded-3xl py-12 px-6 sm:py-[72px] sm:px-12 text-center border-0 overflow-hidden ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.8s' }}
				>
					<div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]' />
					<div className='relative z-10'>
						<h2 className='text-[24px] sm:text-[32px] lg:text-[38px] font-extrabold tracking-tight text-white mb-3 sm:mb-4'>
							Hoziroq Tayyorlanishni Boshlang!
						</h2>
						<p className='text-[14px] sm:text-[17px] text-white/80 max-w-[480px] mx-auto mb-7 sm:mb-9 leading-relaxed'>
							Minglab abituriyentlar Test Market platformasidan foydalanib, DTMga muvaffaqiyatli
							tayyorlanmoqda
						</p>
						<div className='flex flex-col sm:flex-row justify-center gap-3 sm:items-center'>
							<LinkButton href={BOT_URL} target='_blank' rel='noopener noreferrer' size='lg'>
								<IconBrandTelegram size={20} /> Telegram Bot
							</LinkButton>
							<LinkButton href='#fanlar' variant='secondary' size='lg'>
								Testlarni ko&apos;rish
							</LinkButton>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}
