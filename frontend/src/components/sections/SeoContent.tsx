'use client';

import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { Container } from '../ui';
import { useInView } from '@/hooks/useInView';

export default function SeoContent() {
	const { ref, inView } = useInView(0.2);
	const [expanded, setExpanded] = useState(false);

	return (
		<section className='py-10 sm:py-14 bg-white'>
			<Container>
				<div
					ref={ref}
					className={`animate-on-scroll anim-fade-up max-w-3xl mx-auto ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<h2 className='text-[16px] sm:text-[18px] font-bold text-slate-500 mb-4 text-center tracking-tight'>
						DTM va Attestatsiyaga Mukammal Tayyorlanish Platformasi
					</h2>

					<div
						className={`relative overflow-hidden transition-[max-height] duration-500 ${expanded ? 'max-h-[1200px]' : 'max-h-[90px]'}`}
					>
						{!expanded && (
							<div className='absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent' />
						)}
						<div className='space-y-4 text-[13px] sm:text-sm text-slate-400 leading-relaxed'>
						<p>
							Test Market — O&apos;zbekistondagi abituriyentlar, o&apos;qituvchilar va o&apos;quvchilar uchun
							maxsus yaratilgan DTM va attestatsiyaga tayyorlanish platformasi. Platformamiz orqali siz barcha
							fanlar bo&apos;yicha professional darajadagi sinov testlarini ishlashingiz va o&apos;z bilimingizni
							real vaqtda tekshirishingiz mumkin.
						</p>

						<p>
							Bizning testlar haqiqiy DTM imtihoni formatida tuzilgan bo&apos;lib, matematika, fizika, kimyo,
							biologiya, ona tili, O&apos;zbekiston tarixi, ingliz tili va boshqa ko&apos;plab fanlarni qamrab
							oladi. Har bir test savoli mutaxassislar tomonidan tayyorlangan va doimiy yangilanib turadi.
							Majburiy fanlar bloki bo&apos;yicha bepul testlar ham mavjud.
						</p>

						<p>
							DTM ga mukammal tayyorlanish uchun Test Market sizga qulay imkoniyatlar taqdim etadi.
							Telegram bot orqali istalgan vaqtda test ishlang, natijalaringizni batafsil tahlil qiling va
							zaif tomonlaringizni aniqlang. Har bir savolning to&apos;g&apos;ri javobini ko&apos;ring va
							xatolaringizdan o&apos;rganing.
						</p>

						<p>
							Attestatsiya imtihoniga tayyorlanayotgan o&apos;qituvchilar uchun ham maxsus test to&apos;plamlari
							mavjud. Professional testlar yordamida o&apos;z bilim darajangizni baholang va imtihonga ishonch
							bilan kiring. Test Market bilan tayyorlanish oson, qulay va samarali.
						</p>
						</div>
					</div>

					<button
						onClick={() => setExpanded((e) => !e)}
						className='flex items-center gap-1.5 mx-auto mt-3 text-[12px] sm:text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors'
					>
						{expanded ? 'Yopish' : "Ko'proq o'qish"}
						<IconChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
					</button>
				</div>
			</Container>
		</section>
	);
}
