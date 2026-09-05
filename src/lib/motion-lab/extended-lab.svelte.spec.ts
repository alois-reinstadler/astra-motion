import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ExtendedLab from './ExtendedLab.svelte';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function node(name: string): HTMLElement {
	const element = document.querySelector<HTMLElement>(`[data-extra="${name}"]`);
	if (!element) throw new Error(`Missing extended example: ${name}`);
	return element;
}
const controls = () =>
	new Set(
		[...document.querySelectorAll('main *')].map(
			(element) => visualElementStore.get(element)?.projection?.currentAnimation
		)
	);
const active = () => [...controls()].filter(Boolean).length;
async function settled() {
	await expect.poll(active, { timeout: 4000 }).toBe(0);
	await expect
		.poll(() => document.querySelector('main')?.getAnimations({ subtree: true }).length ?? 0, {
			timeout: 4000
		})
		.toBe(0);
}
async function ready() {
	const result = await render(ExtendedLab);
	await frame();
	await frame();
	await settled();
	return result;
}
async function click(name: string) {
	node(name).click();
	await tick();
	await frame();
	await frame();
}
async function pause() {
	const animations = controls();
	for (const animation of animations) {
		if (!animation) continue;
		animation.pause();
		animation.time = 0.035;
	}
	await frame();
	await frame();
	return async () => {
		for (const animation of animations) {
			if (animation) animation.complete();
		}
		await frame();
		await frame();
	};
}
function glyph(element: HTMLElement) {
	const text = element.firstChild;
	if (!text || text.nodeType !== Node.TEXT_NODE) throw new Error('Expected first text node');
	const range = document.createRange();
	range.setStart(text, 0);
	range.setEnd(text, 2);
	return range.getBoundingClientRect();
}

describe('extended laboratory composition', () => {
	it('counter-projects cards from another component when their sidebar changes width', async () => {
		await ready();
		const card = node('dashboard-cards').querySelector<HTMLElement>('article')!;
		const before = card.getBoundingClientRect().width;
		await click('sidebar');
		expect(visualElementStore.get(card)?.projection?.currentAnimation).toBeDefined();
		const finish = await pause();
		try {
			const intermediate = card.getBoundingClientRect().width;
			const target = card.offsetWidth;
			// Auto-fit can remove a column and grow each card when the sidebar opens.
			// Require real movement between both endpoints, regardless of that direction.
			expect(Math.abs(target - before)).toBeGreaterThan(6);
			expect(Math.abs(intermediate - target)).toBeGreaterThan(3);
			const progress = (intermediate - before) / (target - before);
			expect(progress).toBeGreaterThan(0.01);
			expect(progress).toBeLessThan(0.95);
		} finally {
			await finish();
		}
		await click('density');
		await settled();
		const cards = [...node('dashboard-cards').querySelectorAll('article')];
		expect(cards).toHaveLength(4);
		expect(cards[0].getBoundingClientRect().left).toBeCloseTo(
			cards[1].getBoundingClientRect().left,
			0
		);
		expect(cards[1].getBoundingClientRect().top).toBeGreaterThan(
			cards[0].getBoundingClientRect().bottom
		);
	});

	it('cancels delayed content and lets only the latest request reflow the following receipt', async () => {
		await ready();
		await click('load');
		await wait(100);
		await click('cancel-load');
		await wait(700);
		expect(document.querySelector('[data-extra="loaded"]')).toBeNull();
		expect(node('receipt').textContent).toContain('Ready');
		await click('load');
		await wait(400);
		await click('load');
		await wait(300);
		expect(document.querySelector('[data-extra="loaded"]')).toBeNull();
		const oldHeight = node('note').offsetHeight;
		const oldReceipt = node('receipt').getBoundingClientRect().top;
		await expect.poll(() => document.querySelector('[data-extra="loaded"]')).not.toBeNull();
		await settled();
		expect(node('note').offsetHeight).toBeGreaterThan(oldHeight + 20);
		expect(node('receipt').getBoundingClientRect().top).toBeGreaterThan(oldReceipt + 10);
		expect(node('receipt').textContent).toContain('received');
	});

	it('hands the shared marker to the latest selected shelf while its container scrolls', async () => {
		await ready();
		const scroller = node('scroller');
		const previous = node('shelf-marker');
		await click('shelf-3');
		expect(node('shelf-marker')).not.toBe(previous);
		expect(
			visualElementStore.get(node('shelf-marker'))?.projection?.currentAnimation
		).toBeDefined();
		scroller.scrollLeft = 220;
		await click('shelf-4');
		await settled();
		const marker = node('shelf-marker');
		const shelf = node('shelf-4');
		expect(document.querySelectorAll('[data-extra="shelf-marker"]')).toHaveLength(1);
		expect(shelf.getAttribute('aria-pressed')).toBe('true');
		expect(shelf.contains(marker)).toBe(true);
		expect(scroller.scrollLeft).toBeGreaterThan(0);
		expect(marker.getBoundingClientRect().left - shelf.getBoundingClientRect().left).toBeCloseTo(
			12,
			0
		);
		expect(marker.getBoundingClientRect().width).toBeCloseTo(shelf.offsetWidth - 24, 0);
	});

	it('preserves corrected glyph proportions while the comparison exposes raw inherited scaling', async () => {
		await ready();
		const corrected = node('corrected-copy');
		const raw = node('raw-surface').querySelector<HTMLElement>('p')!;
		const correctedBefore = glyph(corrected);
		const rawBefore = glyph(raw);
		await click('resize-text');
		const finish = await pause();
		const parentScale = new DOMMatrix(getComputedStyle(corrected.parentElement!).transform).a;
		expect(Math.abs(parentScale - 1)).toBeGreaterThan(0.05);
		expect(Math.abs(glyph(corrected).width - correctedBefore.width)).toBeLessThan(0.5);
		expect(Math.abs(glyph(corrected).height - correctedBefore.height)).toBeLessThan(0.5);
		expect(Math.abs(glyph(raw).width - rawBefore.width)).toBeGreaterThan(1);
		await finish();
		expect(Math.abs(glyph(raw).width - rawBefore.width)).toBeLessThan(0.5);
	});

	it('waits for the longer child, keeps the latest request, and cannot resurrect a destroyed owner', async () => {
		await ready();
		const first = node('wait-card');
		await click('next-chapter');
		await wait(180);
		expect(node('wait-card')).toBe(first);
		expect(node('wait-child').textContent).toBe('01');
		await click('next-chapter');
		await expect.poll(() => node('wait-child').textContent, { timeout: 2500 }).toBe('03');
		expect(document.querySelectorAll('[data-extra="wait-card"]')).toHaveLength(1);
		await settled();
		await click('next-chapter');
		await click('destroy-wait');
		await expect
			.poll(() => document.querySelector('[data-extra="wait-card"]'), { timeout: 2500 })
			.toBeNull();
		await wait(700);
		expect(document.querySelector('[data-extra="wait-card"]')).toBeNull();
		await click('destroy-wait');
		expect(node('wait-child').textContent).toBe('04');
	});

	it('applies always-reduced immediately while the device-policy lane animates', async () => {
		await ready();
		const oldUser = node('user-policy').getBoundingClientRect().left;
		await click('policy-move');
		const user = node('user-policy');
		const reduced = node('reduced-policy');
		const target = reduced.parentElement!.getBoundingClientRect().right - 6 - reduced.offsetWidth;
		expect(Math.abs(reduced.getBoundingClientRect().left - target)).toBeLessThan(1);
		expect(visualElementStore.get(reduced)?.projection?.currentAnimation).toBeUndefined();
		if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
			expect(visualElementStore.get(user)?.projection?.currentAnimation).toBeDefined();
			expect(user.getBoundingClientRect().left).toBeLessThan(target - 5);
		}
		await settled();
		expect(user.getBoundingClientRect().left).toBeGreaterThan(oldUser + 20);
	});

	it('settles all twenty overlapping changes without a stale shared marker or wait branch', async () => {
		await ready();
		await click('stress');
		await expect.poll(() => node('stress-count').textContent, { timeout: 4000 }).toBe('20 / 20');
		await expect.poll(() => node('wait-child').textContent, { timeout: 3000 }).toBe('21');
		await settled();
		expect(document.querySelectorAll('[data-extra="shelf-marker"]')).toHaveLength(1);
		expect(node('shelf-0').contains(node('shelf-marker'))).toBe(true);
		expect(document.querySelectorAll('[data-extra="wait-card"]')).toHaveLength(1);
		expect(node('dashboard-cards').querySelectorAll('article')).toHaveLength(4);
		expect(active()).toBe(0);
	}, 10000);
});
