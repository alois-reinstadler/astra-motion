// Motion 13.4.4 @ 33f6e72; source mappings and MIT notices: tests/motion-baseline.
import { tick } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { UseScrollOptions } from '../motion/index.js';
import Fixture from './UpstreamScrollExpanded.svelte';
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async () => {
	await tick();
	await frame();
	await frame();
};
const node = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const translate = (id: string) => new DOMMatrix(getComputedStyle(node(id)).transform).m41;
const opacity = (id = 'native') => Number(getComputedStyle(node(id)).opacity);
afterEach(() => {
	vi.unstubAllGlobals();
	window.scrollTo(0, 0);
});
function fallback() {
	vi.stubGlobal('ScrollTimeline', undefined);
	vi.stubGlobal('ViewTimeline', undefined);
}
async function scrollDocument(y: number, x = 0) {
	window.scrollTo(x, y);
	await frames();
}

it.each([false, true])(
	'scroll-initial-sample: fallback=%s reflects initial offset without a manually dispatched event',
	async (force) => {
		if (force) fallback();
		const view = render(Fixture, { initialScroll: 400 });
		await frames();
		await expect.poll(() => view.component.read().y).toBeCloseTo(400, 0);
		await expect.poll(() => view.component.read().py).toBeCloseTo(0.25, 2);
		await expect.poll(() => translate('linked')).toBeCloseTo(25, 1);
	}
);
it('scroll-document-range: window x/y, resize and added content preserve accurate normalized progress', async () => {
	const view = render(Fixture, { mode: 'document' });
	await frames();
	await scrollDocument(300, 200);
	const root = document.scrollingElement!;
	expect(window.scrollY).toBeGreaterThan(100);
	expect(window.scrollX).toBeGreaterThan(100);
	await expect.poll(() => view.component.read().y).toBeCloseTo(window.scrollY, 0);
	await expect.poll(() => view.component.read().x).toBeCloseTo(window.scrollX, 0);
	expect(view.component.read().py).toBeCloseTo(
		window.scrollY / (root.scrollHeight - window.innerHeight),
		2
	);
	expect(view.component.read().px).toBeCloseTo(
		window.scrollX / (root.scrollWidth - window.innerWidth),
		2
	);
	const before = view.component.read().py;
	view.component.grow();
	window.dispatchEvent(new Event('resize'));
	await expect.poll(() => view.component.read().py).toBeLessThan(before);
	expect(view.component.read().py).toBeCloseTo(
		window.scrollY / (root.scrollHeight - window.innerHeight),
		2
	);
});
it('scroll-document-target: target progress differs from document progress and reverses linked styles', async () => {
	const view = render(Fixture, { mode: 'target', offset: ['start start', 'end start'] });
	await frames();
	const start = node('target').getBoundingClientRect().top + window.scrollY;
	await scrollDocument(start + 50);
	await expect.poll(() => view.component.read().py).toBeCloseTo(0.25, 2);
	await expect.poll(() => opacity()).toBeCloseTo(0.25, 2);
	await scrollDocument(start + 150);
	await expect.poll(() => opacity()).toBeCloseTo(0.75, 2);
	await scrollDocument(start);
	await expect.poll(() => opacity()).toBeCloseTo(0, 2);
});
it.each([false, true])(
	'scroll-native-target: transformed scroll ancestor and sticky inner probe agree with containment progress (fallback=%s)',
	async (force) => {
		if (force) fallback();
		const h = window.innerHeight;
		const view = render(Fixture, {
			mode: 'nested-native',
			offset: ['start start', 'end end'],
			targetTop: 2 * h,
			targetHeight: 2 * h,
			contentHeight: 6 * h,
			contentWidth: 300
		});
		await frames();
		await scrollDocument(1.5 * h);
		await expect
			.poll(() => new DOMMatrix(getComputedStyle(node('outer-transform')).transform).a)
			.toBeGreaterThan(0.95);
		expect(new DOMMatrix(getComputedStyle(node('outer-transform')).transform).a).toBeLessThan(1);
		expect(getComputedStyle(node('outer-transform')).clipPath).not.toBe('none');
		for (const p of [0.25, 0.75, 0.5]) {
			await scrollDocument((2 + p) * h);
			await expect.poll(() => view.component.read().py).toBeCloseTo(p, 2);
			await expect.poll(() => opacity()).toBeCloseTo(p, 2);
		}
		const animation = node('native')
			.getAnimations()
			.find((a) => a.timeline?.constructor.name === 'ViewTimeline');
		if (!force && 'ViewTimeline' in window) {
			expect(animation).toBeDefined();
			const range = (animation as Animation & { rangeStart: string | { rangeName: string } })
				.rangeStart;
			expect(typeof range === 'string' ? range : range.rangeName).toContain('contain');
		} else expect(animation).toBeUndefined();
	}
);

const ranges: {
	name: string;
	offset?: UseScrollOptions['offset'];
	range?: string;
	units?: [number, number];
}[] = [
	{ name: 'default', range: 'contain', units: [2, 3] },
	{
		name: 'enter-numeric',
		offset: [
			[0, 1],
			[1, 1]
		],
		range: 'entry-crossing',
		units: [1, 3]
	},
	{
		name: 'enter-string',
		offset: ['start end', 'end end'],
		range: 'entry-crossing',
		units: [1, 3]
	},
	{
		name: 'exit-numeric',
		offset: [
			[0, 0],
			[1, 0]
		],
		range: 'exit-crossing',
		units: [2, 4]
	},
	{
		name: 'exit-string',
		offset: ['start start', 'end start'],
		range: 'exit-crossing',
		units: [2, 4]
	},
	{
		name: 'any-numeric',
		offset: [
			[1, 0],
			[0, 1]
		],
		units: [4, 1]
	},
	{ name: 'any-string', offset: ['end start', 'start end'], units: [4, 1] },
	{
		name: 'all-numeric',
		offset: [
			[0, 0],
			[1, 1]
		],
		range: 'contain',
		units: [2, 3]
	},
	{ name: 'all-string', offset: ['start start', 'end end'], range: 'contain', units: [2, 3] },
	{ name: 'custom-string', offset: ['start center', 'end start'], units: [1.5, 4] },
	{
		name: 'custom-numeric',
		offset: [
			[0.5, 0],
			[1, 0.5]
		],
		units: [3, 3.5]
	},
	{ name: 'single', offset: [[0, 0]] }
];
for (const entry of ranges)
	for (const force of [false, true]) {
		it(`scroll-native-ranges: ${entry.name} fallback=${force} selects range and matches independent forward/reverse progress`, async () => {
			if (force) fallback();
			// Target top=2H and height=2H give hand-calculated edge intervals in viewport units.
			const h = window.innerHeight;
			const view = render(Fixture, {
				mode: 'native',
				offset: entry.offset,
				targetTop: 2 * h,
				targetHeight: 2 * h,
				contentHeight: 6 * h,
				contentWidth: 300
			});
			await frames();
			expect(document.documentElement.clientHeight).toBe(h);
			expect(node('target').clientHeight).toBe(2 * h);
			const samples = entry.units
				? [0, 0.25, 0.75, 1, 0.5, 0].map((progress) => ({
						position: h * (entry.units![0] + (entry.units![1] - entry.units![0]) * progress),
						progress
					}))
				: [h, 2 * h, 3 * h, 2 * h].map((position) => ({ position, progress: 0 }));
			for (const { position, progress } of samples) {
				await scrollDocument(position);
				await expect.poll(() => view.component.read().py).toBeCloseTo(progress, 2);
				await expect.poll(() => opacity()).toBeCloseTo(progress, 2);
			}
			const animation = node('native')
				.getAnimations()
				.find((a) => a.timeline?.constructor.name === 'ViewTimeline');
			if (
				!force &&
				'ViewTimeline' in window &&
				typeof window.ViewTimeline === 'function' &&
				entry.range
			) {
				expect(animation).toBeDefined();
				const native = animation as Animation & {
					rangeStart: string | { rangeName: string };
					rangeEnd: string | { rangeName: string };
				};
				for (const range of [native.rangeStart, native.rangeEnd])
					expect(typeof range === 'string' ? range : range.rangeName).toContain(entry.range);
			} else expect(animation).toBeUndefined();
		});
	}
it('scroll-linked-value-types: paint, opacity, transform and public MotionValue share progress', async () => {
	const view = render(Fixture);
	await frames();
	node('container').scrollTop = 800;
	await expect.poll(() => view.component.read().py).toBeCloseTo(0.5, 2);
	await expect.poll(() => opacity('values')).toBeCloseTo(0.5, 2);
	await expect.poll(() => translate('values')).toBeCloseTo(50, 1);
	// Motion mixes squared RGB channels, then takes their square root.
	expect(getComputedStyle(node('values')).color).toBe('rgb(141, 71, 0)');
	// Accelerated backgroundColor follows native WAAPI's linear channel interpolation.
	expect(getComputedStyle(node('values')).backgroundColor).toBe('rgb(100, 50, 0)');
	expect(Number(node('progress').textContent)).toBeCloseTo(0.5, 2);
	node('container').scrollTop = 0;
	await expect.poll(() => translate('values')).toBeCloseTo(0, 1);
	await expect.poll(() => opacity('values')).toBe(0);
});
it.each([
	{ force: false, custom: false },
	{ force: true, custom: false },
	{ force: false, custom: true }
])(
	'scroll-easing-paths: fallback=$force custom-offset=$custom compares omitted easing and explicit easeOut',
	async ({ force, custom }) => {
		if (force) fallback();
		const offset: UseScrollOptions['offset'] = custom ? [0, 0.5] : undefined;
		const halfway = custom ? 400 : 800,
			finish = custom ? 800 : 1600;
		const linear = render(Fixture, { offset });
		await frames();
		node('container').scrollTop = halfway;
		await expect.poll(() => translate('linked')).toBeCloseTo(50, 1);
		await linear.unmount();
		const eased = render(Fixture, { ease: 'easeOut', offset });
		await frames();
		node('container').scrollTop = halfway;
		await expect.poll(() => translate('linked')).toBeGreaterThan(60);
		expect(translate('linked')).toBeLessThan(100);
		node('container').scrollTop = finish;
		await expect.poll(() => translate('linked')).toBeCloseTo(100, 1);
		await eased.unmount();
	}
);
it('scroll-parallax: independent target ranges drive independent viewport displacement', async () => {
	const view = render(Fixture, { mode: 'parallax', offset: ['start end', 'end start'] });
	await frames();
	await scrollDocument(600);
	const expected = (top: number, height: number) =>
		Math.max(0, Math.min(1, (600 - (top - window.innerHeight)) / (height + window.innerHeight)));
	await expect.poll(() => view.component.read().second).toBeCloseTo(expected(700, 300), 2);
	await expect.poll(() => view.component.read().third).toBeCloseTo(expected(1000, 400), 2);
	expect(view.component.read().second).not.toBe(view.component.read().third);
	await expect
		.poll(() => node('second').getBoundingClientRect().top)
		.toBeCloseTo(700 - 600 - 200 * expected(700, 300), 0);
	await expect
		.poll(() => node('third').getBoundingClientRect().top)
		.toBeCloseTo(1000 - 600 - 200 * expected(1000, 400), 0);
});
it.each([
	{ mode: 'svg', start: 500, height: 100 },
	{ mode: 'svg-root', start: 400, height: 400 }
])(
	'scroll-svg-target: $mode tracks its distinct geometric range',
	async ({ mode, start, height }) => {
		const view = render(Fixture, { mode, offset: ['start start', 'end start'] });
		await frames();
		await scrollDocument(start);
		await expect.poll(() => view.component.read().py).toBeCloseTo(0, 2);
		await scrollDocument(start + height / 2);
		await expect.poll(() => view.component.read().py).toBeCloseTo(0.5, 2);
		await scrollDocument(start + height);
		await expect.poll(() => view.component.read().py).toBeCloseTo(1, 2);
	}
);
it('scroll-late-target: unresolved target stays idle then adopts a late/replacement range', async () => {
	const view = render(Fixture, {
		mode: 'late',
		offset: ['start start', 'end start'],
		contentHeight: window.innerHeight + 1400,
		contentWidth: 300
	});
	await frames();
	await scrollDocument(400);
	expect(view.component.read().py).toBe(0);
	view.component.reveal();
	await frames();
	await scrollDocument(700);
	expect(Math.abs(window.scrollY - 700)).toBeLessThan(1);
	expect(Math.abs(node('target').getBoundingClientRect().top + window.scrollY - 600)).toBeLessThan(
		1
	);
	await expect.poll(() => view.component.read().py).toBeCloseTo(0.5, 2);
	const previous = node('target');
	view.component.replace();
	await frames();
	expect(node('target')).not.toBe(previous);
	await expect.poll(() => view.component.read().py).toBe(0);
	await scrollDocument(1000);
	expect(Math.abs(window.scrollY - 1000)).toBeLessThan(1);
	expect(Math.abs(node('target').getBoundingClientRect().top + window.scrollY - 900)).toBeLessThan(
		1
	);
	await expect.poll(() => view.component.read().py).toBeCloseTo(0.5, 2);
});
it.each([false, true])(
	'scroll-delay-stagger: fallback=%s delayed links complete at bottom and reverse',
	async (force) => {
		if (force) fallback();
		render(Fixture, { delay: 0.4 });
		await frames();
		node('container').scrollTop = 800;
		await expect.poll(() => translate('linked')).toBeGreaterThan(0);
		expect(translate('linked')).toBeLessThan(50);
		node('container').scrollTop = 1600;
		await expect.poll(() => translate('linked')).toBeCloseTo(100, 1);
		for (const item of document.querySelectorAll<HTMLElement>('[data-delay]'))
			await expect
				.poll(() => new DOMMatrix(getComputedStyle(item).transform).m41)
				.toBeCloseTo(100, 1);
		node('container').scrollTop = 0;
		await expect.poll(() => translate('linked')).toBeCloseTo(0, 1);
		for (const item of document.querySelectorAll<HTMLElement>('[data-delay]'))
			await expect
				.poll(() => new DOMMatrix(getComputedStyle(item).transform).m41)
				.toBeCloseTo(0, 1);
	}
);
