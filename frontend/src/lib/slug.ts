export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[‘’ʻʼ'`]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function buildSubjectSlug(id: number, name: string): string {
	const slug = slugify(name);
	return slug ? `${id}-${slug}` : String(id);
}

export function extractSubjectId(slug: string): number | null {
	const match = /^(\d+)/.exec(slug);
	return match ? parseInt(match[1], 10) : null;
}
