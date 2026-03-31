import type { MetadataRoute } from 'next'

const slugs = ['the-js-event-loop-works']

export default function sitemap(): MetadataRoute.Sitemap {
	const base = 'https://imcurious.how'

	return [
		{ url: base, lastModified: new Date() },
		...slugs.map((slug) => ({
			url: `${base}/${slug}`,
			lastModified: new Date(),
		})),
	]
}
