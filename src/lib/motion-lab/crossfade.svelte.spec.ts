import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CrossfadeSpike from './CrossfadeSpike.svelte';

const delay = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));
const pairs = () => [...document.querySelectorAll<HTMLElement>('[data-crossfade-pair]')];
async function settle(expectedPairs: number) {
	await tick();
	await expect.poll(() => pairs().length, { timeout: 5000 }).toBe(expectedPairs);
	await expect
		.poll(
			() =>
				[...document.querySelectorAll('[data-crossfade-pair], [data-crossfade-reflow]')].every(
					(node) => node.getAnimations().length === 0
				),
			{ timeout: 5000 }
		)
		.toBe(true);
}

async function seekSharedMidpoint() {
	// Wait for Svelte's dummy delay animations to become real native keyframe effects.
	// WebKit can still be at that delay stage well after a nominal 65 ms wall-clock wait.
	await expect
		.poll(
			() =>
				pairs().length === 4 &&
				pairs().every((node) =>
					node.getAnimations().some((animation) => animation.effect?.getTiming().duration === 240)
				),
			{ timeout: 5000, interval: 5 }
		)
		.toBe(true);
	const animations = pairs().flatMap((node) =>
		node.getAnimations().filter((animation) => animation.effect?.getTiming().duration === 240)
	);
	for (const animation of animations) animation.pause();
	await Promise.all(animations.map((animation) => animation.ready));
	for (const animation of animations) animation.currentTime = 120;
	return animations;
}
const values = () =>
	pairs().map((node) => ({
		id: node.dataset.crossfadePair,
		width: node.offsetWidth,
		visualWidth: node.getBoundingClientRect().width,
		transform: getComputedStyle(node).transform,
		animations: node.getAnimations().length
	}));

describe('native Svelte crossfade architecture spike', () => {
	it('pairs two simultaneous identities with differing sizes and retains outgoing nodes', async () => {
		const { component } = await render(CrossfadeSpike);
		await settle(2);
		component.swap();
		await tick();
		const animations = await seekSharedMidpoint();
		const intermediate = values();
		console.info('crossfade intermediate', JSON.stringify(intermediate));
		expect(pairs()).toHaveLength(4);
		expect(intermediate.filter((item) => item.transform !== 'none')).toHaveLength(4);
		expect(intermediate.some((item) => Math.abs(item.width - item.visualWidth) > 5)).toBe(true);
		for (const id of ['image', 'title']) {
			const matched = intermediate.filter((item) => item.id === id);
			expect(matched[0].visualWidth).toBeCloseTo(matched[1].visualWidth, 1);
		}
		for (const animation of animations) animation.play();
		await settle(2);
		expect(pairs()).toHaveLength(2);
		expect(pairs().map((node) => node.offsetWidth)).toEqual([180, 220]);
		expect(pairs().every((node) => node.getAnimations().length === 0)).toBe(true);
	});

	it('settles repeated interrupted switches without retained stale branches', async () => {
		const { component } = await render(CrossfadeSpike);
		await settle(2);
		const counts: number[] = [];
		const widths: number[][] = [];
		for (let index = 0; index < 9; index++) {
			component.swap();
			await tick();
			await delay(35);
			counts.push(pairs().length);
			widths.push(pairs().map((node) => node.getBoundingClientRect().width));
		}
		await settle(2);
		console.info('crossfade interruptions', JSON.stringify({ counts, widths, final: values() }));
		expect(pairs()).toHaveLength(2);
		expect(pairs().map((node) => node.offsetWidth)).toEqual([180, 220]);
		expect(pairs().every((node) => node.getAnimations().length === 0)).toBe(true);
		expect(widths.flat().every((width) => Number.isFinite(width) && width > 0)).toBe(true);
	});

	it('does not animate ordinary CSS reflow of an existing crossfade-registered node', async () => {
		const { component } = await render(CrossfadeSpike);
		await settle(2);
		const node = document.querySelector<HTMLElement>('[data-crossfade-reflow]');
		if (!node) throw new Error('Missing existing reflow node');
		const before = node.getBoundingClientRect().left;
		component.reflow();
		await tick();
		expect(node.getBoundingClientRect().left - before).toBe(120);
		expect(node.getAnimations()).toHaveLength(0);
		expect(getComputedStyle(node).transform).toBe('none');
	});

	it('records the current visual geometry when a shared morph reverses in flight', async () => {
		const { component } = await render(CrossfadeSpike);
		await settle(2);
		const original = pairs()[0];
		component.swap();
		await tick();
		const animations = await seekSharedMidpoint();
		const before = original.getBoundingClientRect().width;
		component.swap();
		await tick();
		const immediate = original.getBoundingClientRect().width;
		for (const animation of animations) {
			if (animation.playState === 'paused') animation.play();
		}
		await delay(35);
		const next = original.getBoundingClientRect().width;
		console.info(
			'crossfade reverse geometry',
			JSON.stringify({ before, immediate, after35ms: next })
		);
		await settle(2);
		expect(pairs()[0]).toBe(original);
		expect(original.offsetWidth).toBe(60);
		expect(original.getAnimations()).toHaveLength(0);
	});
});
