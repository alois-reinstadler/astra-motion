import { describe, expect, it } from 'vitest';
import { docs } from './docs.js';
import { pageMetadata, publicPages, robots, sitemap, siteOrigin } from './seo.js';

describe('public site discovery', () => {
	it('publishes every guide and public journey with distinct useful metadata', () => {
		const paths = [
			'/',
			'/about',
			'/status',
			'/examples',
			'/showcase',
			...docs.map((doc) => (doc.slug ? `/docs/${doc.slug}` : '/docs'))
		];
		const xml = sitemap(siteOrigin('https://astra-motion.dev/'));
		expect(Object.keys(publicPages).sort()).toEqual(paths.sort());
		expect(new Set(paths.map((path) => pageMetadata(path)?.title)).size).toBe(paths.length);
		for (const path of paths) {
			expect(xml).toContain(`<loc>https://astra-motion.dev${path}</loc>`);
			expect(pageMetadata(path)?.description.length).toBeGreaterThan(30);
		}
		for (const path of [
			'/motion-lab',
			'/motion-lab/state',
			'/demo',
			'/docs/not-a-guide',
			'/not-a-page',
			'/toString',
			'/__proto__'
		]) {
			expect(pageMetadata(path)).toBeUndefined();
			expect(xml).not.toContain(`<loc>https://astra-motion.dev${path}</loc>`);
		}
	});
	it('fails closed without an explicit public HTTPS origin', () => {
		for (const value of [
			undefined,
			'',
			'not a url',
			'http://astra-motion.dev',
			'https://localhost',
			'https://127.0.0.1',
			'https://100.64.0.2',
			'https://[::1]',
			'https://preview.local',
			'https://preview.internal',
			'https://preview.test',
			'https://astra-motion.dev/docs',
			'https://astra-motion.dev?x=1',
			'https://astra-motion.dev#x',
			'https://user:password@astra-motion.dev',
			'https://astra-motion.dev:4080'
		]) {
			const origin = siteOrigin(value);
			expect(origin).toBeUndefined();
			expect(sitemap(origin)).not.toContain('<loc>');
			expect(robots(origin)).toBe('User-agent: *\nDisallow: /\n');
		}
	});
	it('normalizes a configured origin and points crawlers only to its sitemap', () => {
		const origin = siteOrigin('  https://ASTRA-MOTION.DEV/  ');
		expect(origin).toBe('https://astra-motion.dev');
		expect(robots(origin)).toContain('Sitemap: https://astra-motion.dev/sitemap.xml');
		expect(robots(origin)).toContain('Disallow: /motion-lab');
		expect(robots(origin)).toContain('Disallow: /demo');
	});
});
