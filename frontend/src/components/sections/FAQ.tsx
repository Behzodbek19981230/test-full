'use client';

import { useState } from 'react';
import { IconChevronDown, IconHelpCircle } from '@tabler/icons-react';
import { Container, SectionHeader } from '../ui';
import { useInView } from '@/hooks/useInView';

const faqs = [
	{
		q: "To'lovni qanday amalga oshiraman?",
		a: "Plastik karta orqali ko'rsatilgan summani to'lab, chek skrinshotini yuborasiz. So'ngra to'lov admin tomonidan tekshiriladi va tasdiqlangach fanga kirish ochiladi — odatda bir necha daqiqa ichida.",
	},
	{
		q: 'Bepul test ishlashim mumkinmi?',
		a: 'Ha. "Majburiy fanlar" bloki butunlay bepul va istalgancha marta ishlashingiz mumkin — ro\'yxatdan o\'tish ham shart emas.',
	},
	{
		q: "Testni saytda yoki Telegram bot orqali ishlasam bo'ladimi?",
		a: 'Ikkalasi ham mavjud. Har bir fan tanlanganda "Online test" (saytda, natija shu yerda) yoki "Bot orqali" (Telegram, PDF yuklab olish) formatlaridan birini tanlaysiz.',
	},

	{
		q: "Natijamni qanday ko'raman?",
		a: "Testni tugatgach natija shu zahoti chiqadi: umumiy ball, to'g'ri va noto'g'ri javoblar soni, hamda har bir savol bo'yicha batafsil tahlil.",
	},
	{
		q: "Savolim yoki muammom bo'lsa kimga murojaat qilaman?",
		a: "Sahifa pastidagi Telegram yoki telefon raqami orqali to'g'ridan-to'g'ri murojaat qilishingiz mumkin — javob odatda tez orada beriladi. Chat bot orqali ham murojaat qilishingiz mumkin",
	},
];

export default function FAQ() {
	const { ref: headerRef, inView: headerInView } = useInView(0.2);
	const { ref: listRef, inView: listInView } = useInView(0.1);
	const [open, setOpen] = useState<number | null>(0);

	return (
		<section className='py-16 sm:py-24 bg-white' id='faq'>
			<Container>
				<div
					ref={headerRef}
					className={`animate-on-scroll anim-fade-up ${headerInView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					<SectionHeader
						label={
							<>
								<IconHelpCircle size={16} /> Savollar
							</>
						}
						title="Ko'p Beriladigan Savollar"
						desc="Ro'yxatdan o'tishdan oldin bilishingiz kerak bo'lgan narsalar"
					/>
				</div>

				<div
					ref={listRef}
					className={`animate-on-scroll anim-fade-up max-w-2xl mx-auto ${listInView ? 'in-view' : ''}`}
					style={{ animationDuration: '0.7s' }}
				>
					{faqs.map((f, i) => {
						const isOpen = open === i;
						return (
							<div key={i} className='border-b border-slate-200'>
								<button
									onClick={() => setOpen(isOpen ? null : i)}
									className='w-full flex items-center justify-between gap-4 py-4 sm:py-5 text-left'
								>
									<span className='text-[14px] sm:text-[15px] font-semibold text-slate-900'>
										{f.q}
									</span>
									<IconChevronDown
										size={18}
										className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
									/>
								</button>
								<div
									className={`overflow-hidden transition-[max-height,opacity] duration-300 ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
								>
									<p className='text-[13px] sm:text-[14px] text-slate-600 leading-relaxed pb-4 sm:pb-5 pr-8'>
										{f.a}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</Container>
		</section>
	);
}
