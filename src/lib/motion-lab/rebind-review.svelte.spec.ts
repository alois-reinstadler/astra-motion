import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick, mount, unmount } from 'svelte';
import { visualElementStore } from 'motion-dom';
import RebindReview from './RebindReview.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const x = (node: Element) => new DOMMatrix(getComputedStyle(node).transform).e;

it('keeps an in-flight state animation through a same-node attachment rebind', async () => {
	const screen = render(RebindReview);
	await frame();
	const node = document.querySelector<HTMLElement>('[data-review-rebind]')!;
	screen.component.change(150);
	await expect.poll(() => x(node)).toBeGreaterThan(30);
	const before = x(node);
	screen.component.rebind();
	await tick();
	expect(document.querySelector('[data-review-rebind]')).toBe(node);
	expect(x(node)).toBeGreaterThanOrEqual(before - 2);
	await expect.poll(() => x(node)).toBeCloseTo(150, 1);
});

it('retains native outro completion through same-node attachment rebind', async () => {
	const screen = render(RebindReview, { native: true });
	await frame();
	const node = document.querySelector<HTMLElement>('[data-review-rebind]')!;
	screen.component.show(false);
	await expect.poll(() => x(node)).toBeLessThan(-10);
	const runs = screen.component.runs();
	screen.component.rebind();
	await tick();
	expect(screen.component.runs()).toBe(runs);
	await expect.poll(() => node.isConnected).toBe(false);
});

it('uses current options when a binding remounts on a new element', async () => {
	const screen = render(RebindReview);
	await frame();
	const old = document.querySelector<HTMLElement>('[data-review-rebind]')!;
	screen.component.show(false);
	await tick();
	screen.component.change(120);
	screen.component.show(true);
	await tick();
	await frame();
	const next = document.querySelector<HTMLElement>('[data-review-rebind]')!;
	expect(next).not.toBe(old);
	expect(x(next)).toBeCloseTo(120, 1);
});

it('does not strand a native intro when its attachment is rebound', async () => {
	const target = document.createElement('section');
	document.body.append(target);
	const component = mount(RebindReview, {
		target,
		props: { native: true, initial: true },
		intro: true
	});
	try {
		const node = target.querySelector<HTMLElement>('[data-review-rebind]')!;
		await expect.poll(() => x(node)).toBeGreaterThan(-65);
		expect(x(node)).toBeLessThan(-5);
		component.rebind();
		await tick();
		await expect.poll(() => x(node)).toBeCloseTo(0, 1);
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 2);
	} finally {
		await unmount(component);
		target.remove();
	}
});

it('does not revive a retained exit when an imperative integration replaces its attachment', async () => {
	const screen = render(RebindReview, { native: true });
	await frame();
	const node = document.querySelector<HTMLElement>('[data-review-rebind]')!;
	screen.component.show(false);
	await expect.poll(() => x(node)).toBeLessThan(-10);
	const before = x(node);
	const visual = visualElementStore.get(node)!;
	screen.component.forceRebind();
	await tick();
	await frame();
	await frame();
	expect(Number(visual.latestValues.x)).toBeLessThanOrEqual(before + 1);
	await expect.poll(() => node.isConnected).toBe(false);
	// The removed node's inline styles are restored during cleanup; inspect its final
	// Motion trajectory value to avoid assuming six frames fit inside a 500 ms outro.
	expect(visual.latestValues.x).toBeCloseTo(-80, 1);
});
