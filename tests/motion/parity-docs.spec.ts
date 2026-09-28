import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { settlePointerTarget } from './pointer-target.js';

const groups = [
	[
		'Animations',
		[
			['animations', 'Animations overview'],
			['layout', 'Layout animation'],
			['scroll', 'Scroll animations'],
			['svg', 'SVG animation'],
			['transitions', 'Transitions']
		]
	],
	[
		'Gestures',
		[
			['gestures', 'Gestures'],
			['drag', 'Drag'],
			['hover', 'Hover']
		]
	],
	[
		'Components',
		[
			['motion', '<motion>'],
			['animate-activity', '<AnimateActivity>'],
			['animate-presence', '<AnimatePresence>'],
			['animate-view', '<AnimateView>'],
			['layout-group', 'LayoutGroup'],
			['lazy-motion', '<LazyMotion>'],
			['motion-config', '<MotionConfig>'],
			['reorder', 'Reorder']
		]
	],
	[
		'Motion Values',
		[
			['motion-values', 'Motion Values overview'],
			['use-motion-template', 'useMotionTemplate'],
			['use-motion-value-event', 'useMotionValueEvent'],
			['use-scroll', 'useScroll'],
			['use-spring', 'useSpring'],
			['use-time', 'useTime'],
			['use-transform', 'useTransform'],
			['use-velocity', 'useVelocity']
		]
	],
	[
		'Hooks',
		[
			['use-animate', 'useAnimate'],
			['use-animation-frame', 'useAnimationFrame'],
			['use-drag-controls', 'useDragControls'],
			['use-in-view', 'useInView'],
			['use-page-in-view', 'usePageInView'],
			['use-reduced-motion', 'useReducedMotion']
		]
	],
	[
		'Guides',
		[
			['getting-started', 'Getting started'],
			['accessibility', 'Accessibility'],
			['reduce-bundle-size', 'Reduce bundle size'],
			['text-animation', 'Text animation']
		]
	]
] satisfies [string, [string, string][]][];

// The 63 section/alias IDs published before the documentation reorganization.
const historicalAnchors: Record<string, string[]> = {
	'getting-started': [
		'a-small-set-of-tools',
		'choose-your-entry',
		'build-with-confidence',
		'current-status',
		'install-local-package',
		'use-the-workspace',
		'first-component',
		'motion-component',
		'the-contract',
		'existing-markup',
		'native-bindings',
		'lite-or-full',
		'qualified-dependencies'
	],
	state: ['targets', 'inheritance', 'gestures', 'ownership'],
	presence: ['simultaneous', 'wait', 'pop-layout', 'nested-exits'],
	layout: ['automatic', 'explicit-updates', 'modes', 'scroll'],
	'shared-layout': ['identity', 'groups', 'across-pages'],
	components: [
		'existing-markup',
		'native-bindings',
		'forward-a-binding',
		'headless-components',
		'lifetimes',
		'ssr'
	],
	routes: ['coordinator', 'shared-route-elements', 'fallbacks'],
	scroll: ['container', 'target', 'in-view', 'ownership-and-policy', 'limits'],
	timelines: ['sequence', 'controls', 'boundaries'],
	accessibility: ['policy', 'live-preferences', 'accessibility'],
	api: [
		'tag-components',
		'component-props',
		'create-motion',
		'create-layout',
		'presence',
		'create-scroll',
		'create-in-view',
		'create-animate',
		'routes-and-policy',
		'lite-or-full',
		'qualified-dependencies'
	],
	troubleshooting: ['distortion', 'missing-exit', 'ownership', 'api-status']
};

function captureErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', async (message) => {
		if (message.type() !== 'error') return;
		const index = errors.push(message.text()) - 1;
		const args = await Promise.all(
			message.args().map((argument) =>
				argument
					.evaluate((value) => {
						if (value instanceof Error)
							return { name: value.name, message: value.message, stack: value.stack };
						try {
							return JSON.stringify(value);
						} catch {
							return String(value);
						}
					})
					.catch(() => '<context disposed>')
			)
		);
		errors[index] = JSON.stringify({ text: message.text(), args, location: message.location() });
	});
	page.on('response', (response) => {
		if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
	});
	return errors;
}

test('the sidebar exposes the complete surface in six ordered groups', async ({ page }) => {
	await page.goto('/docs');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Getting started');
	const navigation = page.getByRole('navigation', { name: 'Documentation', exact: true });
	await expect(navigation.locator('.nav-group > p')).toHaveText(groups.map(([name]) => name));
	await expect(navigation.getByRole('link')).toHaveCount(34);
	for (const [index, [, pages]] of groups.entries()) {
		const links = navigation.locator('.nav-group').nth(index).getByRole('link');
		await expect(links).toHaveText(pages.map(([, title]) => title));
		for (const [index, [slug]] of pages.entries()) {
			await expect(links.nth(index)).toHaveAttribute('href', `/docs/${slug}`);
		}
	}
	await expect(
		navigation.getByRole('link', { name: 'Getting started', exact: true })
	).toHaveAttribute('aria-current', 'page');
});

test('all 34 documentation pages hydrate their examples and reference tables without errors', async ({
	page
}) => {
	// This case deliberately visits the complete public surface with one browser page.
	test.setTimeout(120_000);
	const errors = captureErrors(page);
	for (const [group, pages] of groups) {
		for (const [slug, title] of pages) {
			await test.step(`/docs/${slug}`, async () => {
				const response = await page.goto(`/docs/${slug}`);
				expect(response?.status()).toBe(200);
				await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
				await expect(page.locator('[data-example] fieldset[disabled]')).toHaveCount(0);
				const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((node) => node.id));
				expect(new Set(ids).size, `unique anchor and control ids on /docs/${slug}`).toBe(
					ids.length
				);
				if (['Components', 'Motion Values', 'Hooks'].includes(group)) {
					await expect(page.locator('[data-example] .preview-root').first()).toBeAttached();
					const table = page.locator('.reference-table').first();
					await expect(table).toHaveAttribute('role', 'region');
					await expect(table).toHaveAttribute('tabindex', '0');
					await expect(table.locator('thead th[scope="col"]')).toHaveCount(3);
					await expect(table.locator('tbody th[scope="row"]').first()).toBeAttached();
				}
				expect(errors, `browser errors on /docs/${slug}`).toEqual([]);
			});
		}
	}
});

test('reference tables and complete source can be scrolled with a keyboard on mobile', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/docs/motion');
	const table = page.getByRole('region', { name: 'Animation and state props reference' });
	await expect(table.getByRole('columnheader')).toHaveText([
		'Option or API',
		'Default / type',
		'Behavior'
	]);
	await expect(table.getByRole('rowheader').nth(0)).toHaveText('initial');
	await expect(table.getByRole('rowheader').nth(1)).toHaveText('animate');
	await expect(table.getByRole('rowheader').nth(2)).toHaveText('exit');
	await table.focus();
	await expect(table).toBeFocused();
	expect(await table.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
	await page.keyboard.press('ArrowRight');
	await expect.poll(() => table.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
	await page.locator('[data-example="motion-component"] summary').click();
	const source = page.getByRole('region', { name: 'MotionExample.svelte source', exact: true });
	await source.focus();
	await expect(source).toBeFocused();
	await page.keyboard.press('PageDown');
	await expect.poll(() => source.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('historical documentation routes and useful anchors resolve to existing content', async ({
	page,
	request
}) => {
	test.setTimeout(90_000);
	const aliases = [
		['introduction', '/docs/getting-started'],
		['state', '/docs/animations'],
		['presence', '/docs/animate-presence'],
		['shared-layout', '/docs/layout'],
		['timelines', '/docs/use-animate'],
		['routes', '/docs/animate-view'],
		['components', '/docs/motion'],
		['api', '/docs/motion'],
		['troubleshooting', '/docs/getting-started']
	];
	for (const [alias, destination] of aliases) {
		const response = await request.get(`/docs/${alias}`, { maxRedirects: 0 });
		// Static aliases render the canonical article at the old URL, preserving fragments without JS.
		expect(response.status()).toBe(200);
		await page.goto(`/docs/${alias}`);
		await expect(page).toHaveURL(`/docs/${alias}`);
		const title = groups
			.flatMap(([, pages]) => pages)
			.find(([slug]) => `/docs/${slug}` === destination)![1];
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
		await expect(
			page
				.getByRole('navigation', { name: 'Documentation', exact: true })
				.getByRole('link', { name: title, exact: true })
		).toHaveAttribute('aria-current', 'page');
		const canonical = page.locator('link[rel="canonical"]');
		if (await canonical.count()) {
			expect(new URL((await canonical.getAttribute('href'))!).pathname).toBe(destination);
		} else {
			await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
				'content',
				'noindex, nofollow'
			);
		}
	}
	for (const [slug, anchors] of Object.entries(historicalAnchors)) {
		const response = await request.get(`/docs/${slug}`);
		expect(response.status()).toBe(200);
		const html = await response.text();
		for (const anchor of anchors) {
			expect(html, `SSR target for /docs/${slug}#${anchor}`).toContain(`id="${anchor}"`);
		}
	}
	await page.goto('/docs/routes');
	await expect(page.getByRole('link', { name: 'Try the two-page route demo' })).toHaveAttribute(
		'href',
		/motion-lab\/product$/
	);
	for (const route of [
		'/docs/getting-started#motion-component',
		'/docs/getting-started#install-local-package',
		'/docs/getting-started#use-the-workspace',
		'/docs/getting-started#native-bindings',
		'/docs/getting-started#lite-or-full',
		'/docs/getting-started#qualified-dependencies',
		'/docs/layout#automatic',
		'/docs/layout#explicit-updates',
		'/docs/layout#scroll',
		'/docs/scroll#container',
		'/docs/scroll#in-view',
		'/docs/accessibility#live-preferences',
		'/docs/state#inheritance',
		'/docs/state#gestures',
		'/docs/presence#wait',
		'/docs/timelines#controls',
		'/docs/api#create-motion'
	]) {
		await page.goto(route);
		await expect(page).toHaveURL(route);
		const hash = new URL(page.url()).hash.slice(1);
		expect(hash, `preserved anchor for ${route}`).not.toBe('');
		await expect(page.locator(`[id="${hash}"]`), `resolved anchor for ${route}`).toHaveCount(1);
	}
});

test('historical aliases retain their content and fragment without JavaScript', async ({
	browser,
	baseURL
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage();
		for (const [route, title] of [
			['/docs/state#inheritance', 'Animations overview'],
			['/docs/presence#wait', '<AnimatePresence>'],
			['/docs/api#create-motion', '<motion>']
		]) {
			const response = await page.goto(route);
			expect(response?.status()).toBe(200);
			await expect(page).toHaveURL(route);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
			const anchor = route.split('#')[1];
			await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
		}
	} finally {
		await context.close();
	}
});

test('canonical component and deferred-loading source stays identical when copied', async ({
	page
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text: string) => {
					document.documentElement.dataset.copiedSource = text;
				}
			}
		});
	});
	for (const [id, filename] of [
		['motion-component', 'MotionExample.svelte'],
		['animate-activity', 'AnimateActivityExample.svelte'],
		['lazy-motion', 'LazyMotionExample.svelte']
	]) {
		const source = readFileSync(
			new URL(`../../src/lib/site/examples/${filename}`, import.meta.url),
			'utf8'
		)
			.replaceAll("'$lib/motion/index.js'", "'astra-motion'")
			.replaceAll("'$lib/motion/lazy-entry.js'", "'astra-motion/lazy'")
			.replaceAll("'$lib/motion/m/index.js'", "'astra-motion/m'")
			.replaceAll("'$lib/motion/dom-animation.js'", "'astra-motion/features/dom-animation'");
		await page.goto(`/examples/${id}`);
		const example = page.locator(`[data-example="${id}"]`);
		await example.locator('summary').click();
		const code = example
			.getByRole('region', { name: `${filename} source`, exact: true })
			.locator('code');
		expect(await code.textContent()).toBe(source);
		const copy = example.getByRole('button', { name: `Copy ${filename}`, exact: true });
		await settlePointerTarget(copy);
		await copy.click();
		await expect(example.locator('details').getByRole('status')).toHaveText('Copied to clipboard');
		expect(await page.locator('html').getAttribute('data-copied-source')).toBe(source);
		expect(source).not.toContain('$lib');
	}
});

test('the activity reference preserves a native draft across repeated hidden states', async ({
	page
}) => {
	const errors = captureErrors(page);
	await page.goto('/docs/animate-activity');
	const example = page.locator('[data-example="animate-activity"]');
	const input = example.getByLabel('A thought to keep');
	await input.fill('A retained field note');
	await input.evaluate((node) => node.setAttribute('data-original', 'true'));
	for (let iteration = 0; iteration < 3; iteration++) {
		await example.getByRole('button', { name: 'Hide editor', exact: true }).click();
		await expect(example.locator('#retained-editor')).toBeHidden();
		await expect(input).toHaveCount(1);
		await expect(input).toHaveValue('A retained field note');
		await example.getByRole('button', { name: 'Show editor', exact: true }).click();
		await expect(input).toBeVisible();
		await expect(input).toHaveAttribute('data-original', 'true');
		await expect(input).toHaveValue('A retained field note');
	}
	await example
		.getByRole('button', { name: 'Reset Keep a draft while its panel is hidden', exact: true })
		.click();
	await expect(input).toHaveValue('');
	await expect(input).not.toHaveAttribute('data-original');
	expect(errors).toEqual([]);
});

test('the lazy reference keeps native input identity and the latest target while loading', async ({
	page
}) => {
	const errors = captureErrors(page);
	await page.goto('/docs/lazy-motion');
	const example = page.locator('[data-example="lazy-motion"]');
	const input = example.getByLabel('Keep a draft');
	const tile = example.locator('.tile');
	await expect(example.locator('.status')).toHaveText(
		'Native content ready; animation features pending'
	);
	await input.fill('Written before features load');
	await input.evaluate((node) => node.setAttribute('data-original', 'true'));
	await expect
		.poll(() => tile.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41))
		.toBe(-65);
	await example.getByRole('button', { name: 'Change pending target', exact: true }).click();
	await expect(
		example.getByRole('button', { name: 'Change pending target', exact: true })
	).toHaveAttribute('aria-pressed', 'true');
	await expect
		.poll(() => tile.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41))
		.toBe(-65);
	await example.getByRole('button', { name: 'Load animation', exact: true }).click();
	await expect(example.locator('.status')).toHaveText('Animation features loaded');
	await expect
		.poll(() => tile.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41))
		.toBe(65);
	await expect(input).toHaveValue('Written before features load');
	await expect(input).toHaveAttribute('data-original', 'true');
	await expect(example.getByRole('alert')).toHaveCount(0);
	expect(errors).toEqual([]);
});

for (const fallback of [false, true]) {
	test(`the view reference completes a reversible swap ${fallback ? 'with the unavailable-API fallback' : 'with the browser native capability'}`, async ({
		page
	}) => {
		const errors = captureErrors(page);
		if (fallback)
			await page.addInitScript(() => {
				Object.defineProperty(document, 'startViewTransition', {
					configurable: true,
					value: undefined
				});
			});
		await page.goto('/docs/animate-view');
		const supported = await page.evaluate(() => typeof document.startViewTransition === 'function');
		expect(supported).toBe(!fallback);
		const example = page.locator('[data-example="animate-view"]');
		await example
			.locator('[data-shared-art="coast"]')
			.evaluate((node) => node.setAttribute('data-original', 'true'));
		await example.getByRole('button', { name: 'Open Coastal light', exact: true }).click();
		await expect(
			example.getByRole('heading', { name: 'Coastal light', exact: true })
		).toBeVisible();
		await expect(example.locator('[data-view-detail="coast"]')).toHaveCount(1);
		await expect(example.locator('[data-shared-art="coast"]')).not.toHaveAttribute('data-original');
		await expect(example.locator('[data-shared-title="coast"]')).toHaveCount(1);
		await expect(example.locator('.status')).toHaveText(
			supported
				? 'Viewing Coastal light.'
				: 'View changed. This browser uses the immediate fallback.'
		);
		await expect(
			example.getByRole('button', { name: '← Back to collection', exact: true })
		).toBeFocused();
		await expect(page.locator('[data-astra-view-reset]')).toHaveCount(0);
		await example.getByRole('button', { name: '← Back to collection', exact: true }).click();
		await expect(example.locator('.status')).toHaveText(
			supported
				? 'Back to the field notes.'
				: 'View changed. This browser uses the immediate fallback.'
		);
		await expect(
			example.getByRole('button', { name: 'Open Coastal light', exact: true })
		).toBeFocused();
		await expect(example.locator('[data-view-open]')).toHaveCount(3);
		await expect(example.locator('[data-shared-art]')).toHaveCount(3);
		await expect(example.locator('[data-shared-title]')).toHaveCount(3);
		await expect(example.locator('[data-view-detail]')).toHaveCount(0);
		await expect(page.locator('[data-astra-view-reset]')).toHaveCount(0);
		expect(errors).toEqual([]);
	});
}
