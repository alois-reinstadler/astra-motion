import { tick } from 'svelte';
import { visualElementStore, type IProjectionNode } from 'motion-dom';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AutomaticLayout from './AutomaticLayout.svelte';

const delay = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));
const node = (name: string) => {
	const element = document.querySelector<HTMLElement>(`[data-automatic="${name}"]`);
	if (!element) throw new Error(`Missing automatic participant: ${name}`);
	return element;
};
const item = (id: number) => {
	const element = document.querySelector<HTMLElement>(`[data-automatic-item="${id}"]`);
	if (!element) throw new Error(`Missing automatic item ${id}`);
	return element;
};
function projectionFor(element: Element): IProjectionNode {
	const match = visualElementStore.get(element)?.projection;
	if (!match) throw new Error('Projection registration missing');
	return match;
}
async function ready() {
	const result = await render(AutomaticLayout);
	await expect.poll(() => result.component.stats().participants).toBe(9);
	await expect
		.poll(
			() =>
				[...document.querySelectorAll('[data-automatic-item]')].every(
					(element) => element.getAnimations().length === 0
				),
			{ timeout: 4000 }
		)
		.toBe(true);
	await expect.poll(() => result.component.stats().active, { timeout: 4000 }).toBe(0);
	return result;
}
async function moving(element: HTMLElement) {
	await expect
		.poll(() => Boolean(projectionFor(element).currentAnimation), { timeout: 3000, interval: 5 })
		.toBe(true);
	await expect
		.poll(() => getComputedStyle(element).transform !== 'none', { timeout: 3000, interval: 5 })
		.toBe(true);
}

describe('automatic Svelte layout uses ordinary assignments', () => {
	it('projects CSS flex alignment changes with no explicit update boundary', async () => {
		const { component } = await ready();
		const orb = node('orb');
		const before = orb.getBoundingClientRect().left;
		component.align();
		await tick();
		await moving(orb);
		const during = orb.getBoundingClientRect().left;
		expect(during - before).toBeLessThan(160);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(orb.getBoundingClientRect().left - before).toBeCloseTo(280, 0);
	});

	it('projects intrinsic text-driven height and the following sibling', async () => {
		const { component } = await ready();
		const size = node('size');
		const marker = node('marker');
		const oldHeight = size.offsetHeight;
		const oldTop = marker.getBoundingClientRect().top;
		component.expand();
		await tick();
		await moving(size);
		expect(size.offsetHeight).toBeGreaterThan(oldHeight + 40);
		expect(size.getBoundingClientRect().height).toBeLessThan(size.offsetHeight - 20);
		expect(marker.getBoundingClientRect().top - oldTop).toBeLessThan(80);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(size.getBoundingClientRect().height).toBeCloseTo(size.offsetHeight, 0);
	});

	it('reorders keyed children, pops an exit and reverses it during sibling movement', async () => {
		const { component } = await ready();
		const original = item(0);
		const from = original.getBoundingClientRect().left;
		component.reorder();
		await tick();
		await moving(original);
		expect(original.getBoundingClientRect().left - from).toBeLessThan(130);
		component.remove();
		await tick();
		await expect.poll(() => getComputedStyle(original).position).toBe('absolute');
		component.restore();
		await tick();
		await expect.poll(() => getComputedStyle(original).position).not.toBe('absolute');
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(item(0)).toBe(original);
		expect(document.querySelectorAll('[data-automatic-item]')).toHaveLength(4);
		expect(original.offsetLeft).toBe(0);
		component.remove();
		await tick();
		await expect.poll(() => getComputedStyle(original).position).toBe('absolute');
		await expect.poll(() => document.querySelectorAll('[data-automatic-item]').length).toBe(3);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(original.isConnected).toBe(false);
		expect(item(3).offsetLeft).toBe(0);
	});

	it('hands a shared ID to a replacement node using cached geometry', async () => {
		const { component } = await ready();
		const previous = node('lead');
		const from = previous.getBoundingClientRect().left;
		component.swap();
		await tick();
		const incoming = node('lead');
		expect(incoming).not.toBe(previous);
		await moving(incoming);
		expect(incoming.getBoundingClientRect().left - from).toBeLessThan(150);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		expect(incoming.getBoundingClientRect().left - from).toBeCloseTo(240, 0);
	});

	it('observes assignments after an async boundary and releases a parent during animation', async () => {
		const { component } = await ready();
		await component.deferredAlign();
		await tick();
		await moving(node('orb'));
		component.disposeParent();
		await tick();
		await expect.poll(() => component.stats().participants, { timeout: 4000 }).toBe(0);
		await delay(100);
		expect(component.stats()).toEqual({ participants: 0, active: 0 });
		expect(document.querySelector('[data-automatic="parent"]')).toBeNull();
	});

	it('ignores Motion-owned transform writes instead of repeatedly starting geometry transactions', async () => {
		const { component } = await ready();
		const orb = node('orb');
		component.align();
		await tick();
		await moving(orb);
		const root = projectionFor(orb).root;
		const animationId = root?.animationId;
		await delay(120);
		expect(root?.animationId).toBe(animationId);
		await expect.poll(() => component.stats().active, { timeout: 4000 }).toBe(0);
		const settledId = root?.animationId;
		await delay(120);
		expect(root?.animationId).toBe(settledId);
	});
});
