import { IconBrandTelegram } from '@tabler/icons-react';
import { Container, LinkButton } from '../ui';

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`;

export default function CTA() {
	return (
		<section className='py-24'>
			<Container>
				<div className='relative bg-dark-800 rounded-3xl py-[72px] px-12 text-center border border-white/[0.06] overflow-hidden'>
					<div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.12)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,rgba(6,182,212,0.08)_0%,transparent_50%)]' />
					<div className='relative z-10'>
						<h2 className='text-[38px] font-extrabold tracking-tight text-slate-50 mb-4 max-sm:text-[28px]'>
							Hoziroq Tayyorlanishni Boshlang!
						</h2>
						<p className='text-[17px] text-slate-400 max-w-[480px] mx-auto mb-9 leading-relaxed'>
							Minglab abituriyentlar Test Market platformasidan foydalanib, DTMga muvaffaqiyatli
							tayyorlanmoqda
						</p>
						<div className='flex justify-center gap-3 max-sm:flex-col max-sm:items-center'>
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
