import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { AsyncMotionValueAnimation, visualElementStore } from 'motion-dom';
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
