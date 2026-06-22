import { IconBrandTelegram, IconArrowRight, IconClock, IconFileText, IconCheck } from '@tabler/icons-react';
import { LinkButton, Container } from '../ui';

const BOT_URL = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`;

export default function Hero() {
	return (
		<section className='min-h-screen flex items-center relative pt-[72px] overflow-hidden'>
			{/* BG */}
			<div className='absolute inset-0'>
				<div className='absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(26,127,138,0.06)_0%,transparent_70%)] -top-[200px] -left-[200px] animate-[float1_20s_ease-in-out_infinite]' />
				<div className='absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,132,42,0.06)_0%,transparent_70%)] -bottom-[100px] -right-[100px] animate-[float2_25s_ease-in-out_infinite]' />
				<div className='absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]' />
			</div>

			<Container className='relative z-10'>
				<div className='grid lg:grid-cols-2 gap-20 items-center'>
					{/* Left */}
					<div>
						<div className='inline-flex items-center gap-2 px-3.5 py-1.5 pl-2 bg-primary/[0.08] border border-primary/20 rounded-full text-[13px] font-medium text-primary mb-6'>
							<span className='w-2 h-2 rounded-full bg-success animate-[pulse-dot_2s_infinite]' />
							DTM 2024-2025 yangi testlar
						</div>

						<h1 className='text-[58px] font-black leading-[1.08] tracking-[-1.5px] text-slate-900 mb-5 max-lg:text-[40px]'>
							DTM va Attestatsiyaga
							<br />
							<span className='bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
								Mukammal Tayyorlanish
							</span>
						</h1>

						<p className='text-[17px] text-slate-600 leading-relaxed mb-9 max-w-[480px]'>
							Abituriyent, o&apos;qituvchi va o&apos;quvchilar uchun maxsus platforma. Sinov testlarini
							ishlang, natijangizni real vaqtda tekshiring.
						</p>

						<div className='flex gap-3 mb-12 max-sm:flex-col'>
							<LinkButton href={BOT_URL} target='_blank' rel='noopener noreferrer' size='lg'>
								<IconBrandTelegram size={20} /> Telegram orqali boshlash
							</LinkButton>
							<LinkButton href='#fanlar' variant='secondary' size='lg'>
								Testlarni ko&apos;rish <IconArrowRight size={18} />
							</LinkButton>
						</div>

						<div className='flex items-center gap-4'>
							<div className='flex'>
								{['A', 'B', 'S', 'N'].map((l, i) => (
									<div
										key={i}
										className='w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold text-white -ml-2 first:ml-0'
										style={{
											background: [
												'linear-gradient(135deg,#1a7f8a,#15686f)',
												'linear-gradient(135deg,#2da5b2,#1a7f8a)',
												'linear-gradient(135deg,#16a34a,#1a7f8a)',
												'linear-gradient(135deg,#d4842a,#b8711f)',
											][i],
										}}
									>
										{l}
									</div>
								))}
							</div>
							<p className='text-[13px] text-slate-500'>
								<strong className='text-slate-800 font-semibold'>500+</strong> foydalanuvchi ishonch
								bildirgan
							</p>
						</div>
					</div>

					{/* Right — Mock card */}
					<div className='hidden lg:flex justify-center' style={{ perspective: 1000 }}>
						<div className='w-full max-w-[400px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl [transform:rotateY(-5deg)_rotateX(2deg)] hover:[transform:rotateY(0)_rotateX(0)] transition-transform duration-500'>
							<div className='px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div className='w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white'>
										<IconFileText size={22} />
									</div>
									<div>
										<h4 className='text-[15px] font-bold text-slate-900'>Matematika</h4>
										<span className='text-xs text-slate-500'>Savol 3 / 30</span>
									</div>
								</div>
								<div className='flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg text-amber-400 text-[13px] font-semibold'>
									<IconClock size={15} /> 42:15
								</div>
							</div>

							<div className='p-6'>
								<div className='text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5'>
									Savol 3
								</div>
								<p className='text-[15px] font-semibold text-slate-800 mb-4 leading-snug'>
									Agar f(x) = 2x² + 3x - 5 bo&apos;lsa, f(2) ning qiymatini toping.
								</p>
								<div className='flex flex-col gap-2'>
									{[
										['A', '7', false],
										['B', '9', true],
										['C', '11', false],
										['D', '13', false],
									].map(([l, v, c]) => (
										<div
											key={l as string}
											className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all cursor-pointer
                      ${c ? 'bg-success/10 border-success/30' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
										>
											<div
												className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0
                        ${c ? 'bg-success text-white' : 'bg-slate-200 text-slate-600'}`}
											>
												{c ? <IconCheck size={16} /> : (l as string)}
											</div>
											<span
												className={`text-sm ${c ? 'text-success font-medium' : 'text-slate-600'}`}
											>
												{v as string}
											</span>
										</div>
									))}
								</div>
							</div>

							<div className='px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center'>
								<div className='flex-1 mr-4'>
									<div className='h-1 bg-slate-200 rounded-full overflow-hidden mb-1'>
										<div className='h-full bg-gradient-to-r from-primary to-secondary rounded-full w-[10%]' />
									</div>
									<span className='text-[11px] text-slate-500'>3 / 30 savol</span>
								</div>
								<span className='text-[13px] text-success font-semibold'>2 to&apos;g&apos;ri</span>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}
