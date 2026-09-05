import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UpdateMode from './UpdateMode.svelte';

async function setup(automatic: boolean) {
	const result = await render(UpdateMode, { automatic });
	await expect.poll(() => result.component.stats().participants).toBe(2);
	await expect.poll(() => result.component.stats().active).toBe(0);
	const element = document.querySelector<HTMLElement>('[data-testid="update-surface"]');
	if (!element) throw new Error('Missing update example surface');
	return { ...result, element };
}

async function assertIntermediate(element: HTMLElement, oldLeft: number) {
	await expect
		.poll(() => Boolean(visualElementStore.get(element)?.projection?.currentAnimation), {
			interval: 5
		})
		.toBe(true);
	await expect
		.poll(() => element.getBoundingClientRect().left > oldLeft + 4, { interval: 5 })
		.toBe(true);
	const rect = element.getBoundingClientRect();
	// CSS already committed the wider destination, while projection is between the endpoints.
	expect(element.offsetWidth).toBe(220);
	expect(rect.width).toBeGreaterThan(120);
	expect(rect.width).toBeLessThan(210);
	expect(rect.left).toBeLessThan(element.parentElement!.getBoundingClientRect().right - 24 - 220);
}

describe('automatic and explicit update examples', () => {
	it('animates an ordinary assignment with automatic observation', async () => {
		const { component, element } = await setup(true);
		const before = element.getBoundingClientRect().left;
		component.ordinary();
		await tick();
		await assertIntermediate(element, before);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(element.getBoundingClientRect().width).toBeCloseTo(220, 0);
	});
	it('commits ordinary assignments without animation when observation is disabled', async () => {
		const { component, element } = await setup(false);
		const before = element.getBoundingClientRect().left;
		component.ordinary();
		await tick();
		expect(element.getBoundingClientRect().left).toBeGreaterThan(before + 30);
		expect(element.getBoundingClientRect().width).toBe(220);
		expect(component.stats().active).toBe(0);
		expect(visualElementStore.get(element)?.projection?.currentAnimation).toBeUndefined();
	});
	it('animates explicit transactions with observation disabled', async () => {
		const { component, element } = await setup(false);
		const before = element.getBoundingClientRect().left;
		component.transaction();
		await tick();
		await assertIntermediate(element, before);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(element.getBoundingClientRect().width).toBeCloseTo(220, 0);
	});
});
