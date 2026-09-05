import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore, HTMLVisualElement, animateTarget } from 'motion-dom';
import { createPresenceTimeline } from '../motion/presence-state.js';
import LiteState from './LiteState.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
it('captures the WAAPI to native-presence handoff across repeated inherited exits', async () => {
	const failures: { run: number; source: unknown; held: number }[] = [];
	for (let run = 0; run < 5; run++) {
		const screen = render(LiteState);
		await tick();
		await frame();
		await frame();
		const parent = document.querySelector<HTMLElement>('[data-lite="parent"]')!;
		const child = document.querySelector<HTMLElement>('[data-lite="child"]')!;
		try {
			screen.component.change();
			await expect
				.poll(() => new DOMMatrix(getComputedStyle(child).transform).e)
				.toBeCloseTo(80, 1);
			await expect.poll(() => Number(getComputedStyle(parent).opacity)).toBeCloseTo(0.8, 2);
			const source = visualElementStore.get(parent)?.latestValues.opacity;
			screen.component.toggle();
			await tick();
			await expect.poll(() => Number(getComputedStyle(child).opacity)).toBeLessThan(0.8);
			const held = Number(getComputedStyle(parent).opacity);
			if (Math.abs(held - 0.8) > 0.01) failures.push({ run, source, held });
		} finally {
			await screen.unmount();
		}
	}
	expect(failures).toHaveLength(0);
}, 10000);

it('captures a finished native animation before its asynchronous finish event', async () => {
	const screen = render(LiteState);
	await tick();
	await frame();
	await frame();
	const parent = document.querySelector<HTMLElement>('[data-lite="parent"]')!;
	const child = document.querySelector<HTMLElement>('[data-lite="child"]')!;
	try {
		screen.component.change();
		await expect.poll(() => parent.getAnimations().length).toBeGreaterThan(0);
		const native = parent.getAnimations()[0];
		native.finish();
		const before = Number(getComputedStyle(parent).opacity);
		expect(visualElementStore.get(parent)?.values.get('opacity')?.get()).toBe(1);
		screen.component.toggle();
		await tick();
		await expect.poll(() => Number(getComputedStyle(child).opacity)).toBeLessThan(0.8);
		expect(before).toBeCloseTo(0.8, 2);
		expect(Number(getComputedStyle(parent).opacity)).toBeCloseTo(0.8, 2);
	} finally {
		await screen.unmount();
	}
});

it.each(['forward', 'backward', 'reverse-repeat'] as const)(
	'uses the correct %s keyframe endpoint and suppresses the old finish event',
	async (direction) => {
		const node = document.createElement('div');
		node.style.opacity = '1';
		document.body.append(node);
		const visual = new HTMLVisualElement({
			presenceContext: null,
			props: {},
			visualState: {
				latestValues: { opacity: 1 },
				renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
			}
		});
		visual.mount(node);
		try {
			animateTarget(visual, {
				opacity: [0.3, 0.6, 0.8],
				transition: {
					duration: 1,
					ease: 'linear',
					...(direction === 'reverse-repeat' ? { repeat: 1, repeatType: 'reverse' as const } : {})
				}
			});
			await expect.poll(() => node.getAnimations().length).toBeGreaterThan(0);
			const native = node.getAnimations()[0];
			let finishCalls = 0;
			const finishHandler = native.onfinish;
			native.onfinish = function (event) {
				finishCalls++;
				finishHandler?.call(this, event);
			};
			if (direction === 'backward') native.playbackRate = -1;
			native.finish();
			const expected = direction === 'forward' ? 0.8 : 0.3;
			expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(expected, 2);
			const timeline = createPresenceTimeline(
				visual,
				{ ...visual.latestValues },
				{ opacity: 0 },
				{ duration: 0.2, ease: 'linear' },
				'out'
			);
			timeline.tick!(1, 0);
			expect(visual.latestValues.opacity).toBeCloseTo(expected, 2);
			timeline.tick!(0.5, 0.5);
			const immediate = visual.latestValues.opacity;
			await frame();
			await frame();
			expect(finishCalls).toBe(0);
			expect(immediate).toBeCloseTo(expected / 2, 2);
			expect(visual.latestValues.opacity).toBeCloseTo(expected / 2, 2);
			expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(expected / 2, 2);
			expect(node.getAnimations()).toHaveLength(0);
			timeline.cancel();
		} finally {
			visual.unmount();
			node.remove();
		}
	}
);
