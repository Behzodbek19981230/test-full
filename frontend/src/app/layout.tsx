import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

const SITE_URL = 'https://test-market.uz';
const SITE_NAME = 'Test Market';
const TITLE = 'Test Market — DTM va Attestatsiyaga Tayyorlanish Platformasi';
const DESCRIPTION =
	"Abituriyent, o'qituvchi va o'quvchilar uchun DTM va attestatsiyaga tayyorlanish platformasi. Bepul majburiy fanlar testlari, barcha fanlar bo'yicha sinov testlari, real vaqtda natijalar va Telegram bot orqali qulay tayyorlanish.";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: TITLE,
		template: `%s | ${SITE_NAME}`,
	},
	description: DESCRIPTION,
	keywords: [
		'test market',
		'DTM testlar',
		'bepul DTM testlar',
		'bepul test',
		'majburiy fanlar test',
		'milliy sertifikat testlar',
		'attestatsiya testlari',
		'online test',
		'sinov test',
		'matematika test',
		'fizika test',
		'ingliz tili test',
		'biologiya test',
		'DTM tayyorlanish',
		'abituriyent',
		'test market',
		'uzbekistan test',
		"o'zbek tili test",
		'kimyo test',
		'tarix test',
		'matematika',
		"o'zbekiston tarixi test",
		'ona tili test',
	],
	authors: [{ name: SITE_NAME, url: SITE_URL }],
	creator: SITE_NAME,
	publisher: SITE_NAME,
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	openGraph: {
		type: 'website',
		locale: 'uz_UZ',
		url: SITE_URL,
		siteName: SITE_NAME,
		title: TITLE,
		description: DESCRIPTION,
		images: [
			{
				url: '/logo.png',
				width: 1200,
				height: 630,
				alt: TITLE,
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: TITLE,
		description: DESCRIPTION,
		images: ['/logo.png'],
	},
	alternates: {
		canonical: SITE_URL,
	},
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: '16x16 32x32' },
			{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
		],
		apple: '/apple-touch-icon.png',
	},
	manifest: '/manifest.json',
	verification: {
		google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
	},
};

const YM_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: SITE_NAME,
		url: SITE_URL,
		description: DESCRIPTION,
		sameAs: [`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`],
		offers: [
			{
				'@type': 'Offer',
				category: 'Online Test',
				price: '0',
				priceCurrency: 'UZS',
				description: "Majburiy fanlar bo'yicha bepul DTM testlari — matematika, ona tili, O'zbekiston tarixi",
				areaServed: { '@type': 'Country', name: 'Uzbekistan' },
			},
			{
				'@type': 'Offer',
				category: 'Online Test',
				description: "DTM va attestatsiya uchun barcha fanlar bo'yicha professional testlar",
				areaServed: { '@type': 'Country', name: 'Uzbekistan' },
			},
		],
	};

	return (
		<html lang='uz'>
			<head>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
				<link
					href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap'
					rel='stylesheet'
				/>
				<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
				{YM_ID && (
					<script
						dangerouslySetInnerHTML={{
							__html: `
									(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
									m[i].l=1*new Date();
									for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
									k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
									(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}","ym");
									ym(${YM_ID},"init",{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
								`,
						}}
					/>
				)}
			</head>
			<body>
				{YM_ID && (
					<noscript>
						<div>
							<img
								src={`https://mc.yandex.ru/watch/${YM_ID}`}
								style={{ position: 'absolute', left: '-9999px' }}
								alt=''
							/>
						</div>
					</noscript>
				)}
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
