// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamVariantUpdates.svelte';
const node = (id: string) =>
	document.querySelector<HTMLElement>(`[data-upstream-variant="${id}"]`)!;
const x = (id: string) => new DOMMatrix(getComputedStyle(node(id)).transform).m41;
const opacity = () => Number(getComputedStyle(node('fallback')).opacity);
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it('variant-reactive-fallback: removed labels/properties restore style and relinquish future style ownership', async () => {
	const { component } = render(Fixture);
	await expect.poll(opacity).toBe(1);
	expect(x('fallback')).toBe(100);
	flushSync(() => component.select('b'));
	await expect.poll(() => x('fallback')).toBe(0);
	expect(opacity()).toBe(0.4);
	flushSync(() => component.select(undefined));
	await expect.poll(opacity).toBe(0.2);
	flushSync(() => component.style(0.5));
	await expect.poll(opacity).toBe(0.5);
	flushSync(() => component.select('a'));
	await expect.poll(opacity).toBe(1);
	flushSync(() => component.style(0.7));
	await frames();
	expect(opacity()).toBe(1);
	flushSync(() => component.select(undefined));
	await expect.poll(opacity).toBe(0.7);
});
it('variant-reactive-fallback: inherited values react independently and explicit child labels remain independent', async () => {
	const { component } = render(Fixture);
	await expect.poll(() => x('inherited')).toBe(40);
	expect(x('explicit')).toBe(10);
	flushSync(() => component.changeInherited(80));
	await expect.poll(() => x('inherited')).toBe(80);
	flushSync(() => component.select('b'));
	await expect.poll(() => x('inherited')).toBe(0);
	expect(x('explicit')).toBe(10);
	flushSync(() => component.changeOwn());
	await expect.poll(() => x('explicit')).toBe(70);
	flushSync(() => component.select('a'));
	await expect.poll(() => x('inherited')).toBe(80);
	expect(x('explicit')).toBe(70);
});
it('variant-identical-keyframes: a b a replays shared keyframes in inline and stable variants without identity-only reruns', async () => {
	const samples: Record<string, number[]> = { inline: [], stable: [] };
	const completions: Record<string, number> = { inline: 0, stable: 0 };
	const { component } = render(Fixture, {
		scenario: 'replay',
		onUpdate: (lane, value) => samples[lane].push(value),
		onComplete: (lane) => {
			completions[lane]++;
		}
	});
	for (const [index, label] of ['a', 'b', 'a'].entries()) {
		if (index) {
			samples.inline = [];
			samples.stable = [];
			flushSync(() => component.select(label));
		}
		await expect.poll(() => completions.inline).toBe(index + 1);
		await expect.poll(() => completions.stable).toBe(index + 1);
		for (const lane of ['inline', 'stable']) {
			expect(samples[lane].some((value) => value > 1)).toBe(true);
			expect(samples[lane].at(-1)).toBe(0);
		}
	}
	samples.inline = [];
	samples.stable = [];
	flushSync(() => component.rerender());
	await frames(5);
	expect(completions).toEqual({ inline: 3, stable: 3 });
	expect(samples.inline).toEqual([]);
	expect(samples.stable).toEqual([]);
});
it('variant-gesture-protected: tapping during hover changes the inherited composite label without stale protected paint', async () => {
	// Synthetic events do not move the real mouse left by earlier browser tests.
	const parking = document.createElement('div');
	parking.style.cssText =
		'position:fixed;left:200px;top:150px;width:20px;height:20px;z-index:2147483647;';
	document.body.append(parking);
	try {
		await userEvent.hover(parking, { timeout: 2000 });
	} finally {
		parking.remove();
	}
	render(Fixture, { scenario: 'hover' });
	await frames();
	const color = () => getComputedStyle(node('paint')).backgroundColor;
	expect(color()).toBe('rgb(255, 255, 0)');
	node('hover-parent').dispatchEvent(
		new PointerEvent('pointerenter', { pointerType: 'mouse', isPrimary: true })
	);
	await expect.poll(color).toBe('rgb(150, 150, 0)');
	node('trigger').dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerType: 'mouse',
			pointerId: 1,
			isPrimary: true,
			bubbles: true
		})
	);
	await expect.poll(() => node('hover-parent').dataset.pressed).toBe('true');
	node('trigger').dispatchEvent(
		new PointerEvent('pointerup', {
			pointerType: 'mouse',
			pointerId: 1,
			isPrimary: true,
			bubbles: true
		})
	);
	await expect.poll(() => node('hover-parent').dataset.pressed).toBe('false');
	await expect.poll(color).toBe('rgb(0, 150, 150)');
	node('hover-parent').dispatchEvent(
		new PointerEvent('pointerleave', { pointerType: 'mouse', isPrimary: true })
	);
	await expect.poll(color).toBe('rgb(0, 255, 255)');
});
