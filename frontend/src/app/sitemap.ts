import type { MetadataRoute } from 'next';

const SITE_URL = 'https://test-market.uz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const subjects: { id: number }[] = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects`)
		.then((r) => r.json())
		.catch(() => []);

	const subjectPages = subjects.map((s) => ({
		url: `${SITE_URL}/quiz/${s.id}`,
		lastModified: new Date(),
		changeFrequency: 'weekly' as const,
		priority: 0.7,
	}));

	return [
		{
			url: SITE_URL,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1,
		},
		{
			url: `${SITE_URL}/login`,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 0.5,
		},
		...subjectPages,
	];
}
