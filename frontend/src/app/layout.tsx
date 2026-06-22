import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

const SITE_URL = 'https://test-market.uz';
const SITE_NAME = 'Test Market';
const TITLE = 'Test Market — DTM va Attestatsiyaga Tayyorlanish Platformasi';
const DESCRIPTION =
	"Abituriyent, o'qituvchi va o'quvchilar uchun DTM va attestatsiyaga tayyorlanish platformasi. Barcha fanlar bo'yicha sinov testlari, real vaqtda natijalar va Telegram bot orqali qulay tayyorlanish.";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: TITLE,
		template: `%s | ${SITE_NAME}`,
	},
	description: DESCRIPTION,
	keywords: [
		'DTM testlar',
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
				url: '/og-image.png',
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
		images: ['/og-image.png'],
	},
	alternates: {
		canonical: SITE_URL,
	},
	icons: {
		icon: '/favicon.ico',
		apple: '/apple-touch-icon.png',
	},
	verification: {
		google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: SITE_NAME,
		url: SITE_URL,
		description: DESCRIPTION,
		sameAs: [`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME}`],
		offers: {
			'@type': 'Offer',
			category: 'Online Test',
			description: "DTM va attestatsiya uchun barcha fanlar bo'yicha professional testlar",
			areaServed: { '@type': 'Country', name: 'Uzbekistan' },
		},
	};

	return (
		<html lang='uz'>
			<head>
				<link
					rel='stylesheet'
					href='https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
					crossOrigin='anonymous'
				/>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
				<link
					href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
					rel='stylesheet'
				/>
				<script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
