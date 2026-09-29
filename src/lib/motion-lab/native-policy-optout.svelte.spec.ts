import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { AsyncMotionValueAnimation, JSAnimation, visualElementStore } from 'motion-dom';
import Fixture from './NativePolicyOptOut.svelte';
it('preserves target-level reduction opt-outs in both layout-enabled authoring paths', async () => {
	const { component } = render(Fixture);
	const readVisuals = () =>
		['native', 'component'].map((kind) =>
			visualElementStore.get(document.querySelector(`[data-optout="${kind}"]`)!)!
		);
	await expect
		.poll(() =>
			readVisuals().every((v) => v?.getValue('x')?.animation instanceof AsyncMotionValueAnimation)
		)
		.toBe(true);
	const visuals = readVisuals();
	const controls = visuals.map(
		(v) => v.getValue('x')!.animation as AsyncMotionValueAnimation<number>
	);
	for (const playback of controls) {
		playback.pause();
		playback.time = 1;
	}
	await expect.poll(() => visuals.map((v) => v.getValue('x')!.get())).toEqual([20, 20]);
	flushSync(() => component.reduce());
	await expect.poll(() => visuals.map((v) => v.shouldReduceMotion)).toEqual([true, true]);
	expect(visuals.map((v) => v.getValue('x')!.get())).toEqual([20, 20]);
	expect(controls.map((p) => p.state)).toEqual(['paused', 'paused']);
	for (const playback of controls) playback.complete();
	await expect.poll(() => visuals.map((v) => v.getValue('x')!.get())).toEqual([100, 100]);
});

it('preserves an imperative path override opt-out during a live policy change', async () => {
	const { component } = render(Fixture);
	const readVisual = () =>
		visualElementStore.get(document.querySelector('[data-optout="native"]')!)!;
	await expect
		.poll(() => readVisual()?.getValue('x')?.animation instanceof AsyncMotionValueAnimation)
		.toBe(true);
	const visual = readVisual();
	const entrance = visual.getValue('x')!.animation;
	if (!(entrance instanceof AsyncMotionValueAnimation))
		throw new Error('Expected entrance controls');
	entrance.complete();
	await expect.poll(() => visual.getValue('x')!.get()).toBe(100);

	// The opt-out lives only in the imperative override, which is injected into
	// animateTarget's target transition when it carries the path adapter.
	const finished = component.runPath();
	const playback = visual.getValue('x')!.animation;
	if (!(playback instanceof JSAnimation)) throw new Error('Expected an engine arc clock');
	expect(visual.getValue('y')!.animation).toBe(playback);
	playback.pause();
	playback.time = 1;
	const position = () => [visual.getValue('x')!.get(), visual.getValue('y')!.get()];
	await expect.poll(position).toEqual([125, 18.75]);

	flushSync(() => component.reduce());
	await expect.poll(() => visual.shouldReduceMotion).toBe(true);
	expect(visual.getValue('x')!.animation).toBe(playback);
	expect(visual.getValue('y')!.animation).toBe(playback);
	expect(playback.state).toBe('paused');
	expect(position()).toEqual([125, 18.75]);

	playback.complete();
	await finished;
	expect(position()).toEqual([200, 0]);
});

for (const reduceMotion of [false, true]) {
	it(`honors an imperative non-path reduction override of ${reduceMotion}`, async () => {
		const { component } = render(Fixture);
		const read = () => visualElementStore.get(document.querySelector('[data-optout="native"]')!)!;
		await expect
			.poll(() => read()?.getValue('x')?.animation instanceof AsyncMotionValueAnimation)
			.toBe(true);
		const visual = read();
		const value = visual.getValue('x')!;
		const entrance = value.animation as AsyncMotionValueAnimation<number>;
		entrance.complete();
		await expect.poll(() => value.get()).toBe(100);
		if (!reduceMotion) {
			flushSync(() => component.reduce());
			await expect.poll(() => visual.shouldReduceMotion).toBe(true);
		}
		const finished = component.runPlain(reduceMotion);
		if (!reduceMotion) {
			const playback = value.animation;
			if (!(playback instanceof AsyncMotionValueAnimation))
				throw new Error('Expected owned animation');
			playback.pause();
			playback.time = 1;
			await expect.poll(() => value.get()).toBe(125);
			expect(playback.state).toBe('paused');
			playback.complete();
		}
		await finished;
		expect(value.get()).toBe(200);
		expect(value.isAnimating()).toBe(false);
	});
}

it('preserves default skipAnimations when overriding reduction', async () => {
	const { component } = render(Fixture);
	const read = () => visualElementStore.get(document.querySelector('[data-optout="native"]')!)!;
	await expect
		.poll(() => read()?.getValue('x')?.animation instanceof AsyncMotionValueAnimation)
		.toBe(true);
	const visual = read();
	(visual.getValue('x')!.animation as AsyncMotionValueAnimation<number>).complete();
	await expect.poll(() => visual.getValue('x')!.get()).toBe(100);
	flushSync(() => component.skip());
	await expect.poll(() => visual.getDefaultTransition()?.skipAnimations).toBe(true);
	await component.runPlain(false);
	expect(visual.getValue('x')!.get()).toBe(200);
	expect(visual.getValue('x')!.isAnimating()).toBe(false);
});
