'use client';

import { Container } from '../ui';
import { useInView } from '@/hooks/useInView';

export default function SeoContent() {
	const { ref, inView } = useInView(0.2);

	return (
		<section className='py-16 sm:py-24 bg-white'>
			<Container>
				<div
					ref={ref}
					className={`animate-on-scroll anim-fade-up max-w-3xl mx-auto ${inView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<h2 className='text-[22px] sm:text-[28px] font-extrabold text-slate-900 mb-6 text-center tracking-tight'>
						DTM va Attestatsiyaga Mukammal Tayyorlanish Platformasi
					</h2>

					<div className='space-y-4 text-[15px] sm:text-base text-slate-600 leading-relaxed'>
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
			</Container>
		</section>
	);
}
