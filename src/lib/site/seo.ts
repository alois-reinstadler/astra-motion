import { docs } from './docs.js';

export interface PageMetadata {
	title: string;
	description: string;
}

export const publicPages: Record<string, PageMetadata> = {
	'/': {
		title: 'Astra Motion — Motion for Svelte 5',
		description:
			'Motion’s animation engine, connected to Svelte’s lifecycle. Animate native elements, layout changes and exits. Explore the working beta and its examples.'
	},
	'/about': {
		title: 'Why Astra — Astra Motion',
		description:
			'Why Astra connects Motion to Svelte: native elements, Svelte-owned exits, shared layout and a focused framework adapter.'
	},
	'/status': {
		title: 'Project status — Astra Motion',
		description:
			'What the Astra Motion beta supports, how to evaluate it, and what remains before a public release. Browser coverage, compatibility and known limits.'
	},
	'/examples': {
		title: 'Interactive examples — Astra Motion',
		description:
			'Try Svelte animation examples for layout, presence, gestures, scroll and timelines. Each example includes complete component source.'
	},
	'/showcase': {
		title: 'Fieldwork showcase — Astra Motion',
		description:
			'Explore a photo studio built with Astra Motion: shared photo transitions, an editing desk, a queue and a scroll journal, with complete source.'
	},
	...Object.fromEntries(
		docs.map((doc) => [
			doc.slug ? `/docs/${doc.slug}` : '/docs',
			{
				title: `${doc.title} — Astra Motion documentation`,
				description: doc.summary
			}
		])
	)
};

/** Only an explicitly configured public HTTPS origin may become a canonical URL. */
export function siteOrigin(value: string | undefined): string | undefined {
	if (!value?.trim()) return undefined;
	try {
		const url = new URL(value.trim());
		const hostname = url.hostname.toLowerCase();
		if (
			url.protocol !== 'https:' ||
			url.username ||
			url.password ||
			url.port ||
			url.pathname !== '/' ||
			url.search ||
			url.hash ||
			!hostname.includes('.') ||
			hostname.endsWith('.') ||
			/(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(hostname) ||
			/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
			hostname.includes(':')
		)
			return undefined;
		return url.origin;
	} catch {
		return undefined;
	}
}

export function pageMetadata(pathname: string) {
	return Object.hasOwn(publicPages, pathname) ? publicPages[pathname] : undefined;
}

export function sitemap(origin: string | undefined): string {
	const urls = origin
		? Object.keys(publicPages)
				.map((path) => `<url><loc>${origin}${path}</loc></url>`)
				.join('\n')
		: '';
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function robots(origin: string | undefined): string {
	return origin
		? `User-agent: *\nAllow: /\nDisallow: /motion-lab\nDisallow: /demo\n\nSitemap: ${origin}/sitemap.xml\n`
		: 'User-agent: *\nDisallow: /\n';
}
