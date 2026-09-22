import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { mount, tick, unmount } from 'svelte';
import StatePage from '../../routes/motion-lab/state/+page.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => {
	for (const cleanup of cleanups.splice(0)) await cleanup();
	await page.viewport(1280, 900);
});
async function fixture() {
	const target = document.createElement('div');
	document.body.append(target);
	const app = mount(StatePage, { target });
	cleanups.push(async () => {
		await unmount(app);
		target.remove();
	});
	await tick();
	await frame();
	await frame();
	const select = <T extends HTMLElement>(selector: string) => target.querySelector<T>(selector)!;
	return { target, select };
}

it('settles the full presence/resize stress demonstration with one real card', async () => {
	const { select, target } = await fixture();
	select<HTMLButtonElement>('[data-state="stress"]').click();
	await expect
		.poll(() => select('[data-state="stress"]').hasAttribute('disabled'), { timeout: 4000 })
		.toBe(false);
	await expect.poll(() => target.querySelectorAll('[data-state="presence-card"]').length).toBe(1);
	await expect
		.poll(() => Number(getComputedStyle(select('[data-state="presence-card"]')).opacity))
		.toBeCloseTo(1, 3);
	expect(select('[data-state="presence-card"]').style.transform).not.toContain('NaN');
	select<HTMLButtonElement>('[data-state="toggle"]').click();
	await expect.poll(() => target.querySelector('[data-state="presence-card"]')).toBeNull();
});

it('staggers inherited child variants and reverses the sequence', async () => {
	const { select, target } = await fixture();
	select<HTMLButtonElement>('[data-state="sequence"]').click();
	const tiles = [...target.querySelectorAll<HTMLElement>('[data-state-tile]')];
	await expect
		.poll(
			() => Number(getComputedStyle(tiles[0]).opacity) - Number(getComputedStyle(tiles[5]).opacity),
			{ timeout: 2000 }
		)
		.toBeGreaterThan(0.05);
	await expect
		.poll(() =>
			tiles.every((tile) => Math.abs(new DOMMatrix(getComputedStyle(tile).transform).f + 24) < 0.1)
		)
		.toBe(true);
	select<HTMLButtonElement>('[data-state="sequence"]').click();
	await expect
		.poll(() =>
			tiles.every((tile) => Math.abs(new DOMMatrix(getComputedStyle(tile).transform).f) < 0.1)
		)
		.toBe(true);
});

it('updates the MotionValue slider, reduces spring feedback, and supports keyboard drag reset', async () => {
	const { select } = await fixture();
	const slider = select<HTMLInputElement>('#motion-progress');
	slider.value = '85';
	slider.dispatchEvent(new Event('input', { bubbles: true }));
	await expect
		.poll(() => new DOMMatrix(getComputedStyle(select('.direct')).transform).e)
		.toBeCloseTo(153, 1);
	await expect
		.poll(() => new DOMMatrix(getComputedStyle(select('.spring')).transform).e)
		.toBeCloseTo(153, 1);
	select<HTMLInputElement>('input[type="checkbox"]').click();
	await tick();
	await frame();
	slider.value = '10';
	slider.dispatchEvent(new Event('input', { bubbles: true }));
	await frame();
	await frame();
	expect(new DOMMatrix(getComputedStyle(select('.spring')).transform).e).toBeCloseTo(18, 1);
	const card = select<HTMLButtonElement>('[data-state="draggable"]');
	card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
	await frame();
	await frame();
	expect(new DOMMatrix(getComputedStyle(card).transform).e).toBeCloseTo(20, 1);
	card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
	await frame();
	await frame();
	expect(new DOMMatrix(getComputedStyle(card).transform).e).toBeCloseTo(0, 1);
});

it('fits the mobile viewport and keeps the keyboard-driven card inside its bounds', async () => {
	await page.viewport(390, 844);
	const { select, target } = await fixture();
	const main = select('main');
	expect(main.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
	const card = select<HTMLButtonElement>('[data-state="draggable"]');
	for (let index = 0; index < 30; index++)
		card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
	await frame();
	await frame();
	expect(card.getBoundingClientRect().right).toBeLessThan(
		select('.drag-stage').getBoundingClientRect().right
	);
	await page.elementLocator(select('#presence')).screenshot();
	await page.elementLocator(select('#drag')).screenshot();
	expect(target.querySelectorAll('[data-state-tile]')).toHaveLength(6);
});
