import { flushSync, tick } from 'svelte';
import { expect, it, onTestFinished, vi } from 'vitest';
import { AsyncMotionValueAnimation, visualElementStore } from 'motion-dom';
import { render } from 'vitest-browser-svelte';
import Accordion from '$lib/site/snippet-previews/getting-started--accordion-recipe.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const near = (actual: number, expected: number) =>
	expect(Math.abs(actual - expected)).toBeLessThan(0.5);

// Hold the real native clock rather than assuming a 200 ms transition exposes
// three paints on every engine. Svelte still owns each transition and its ticks.
function controlNativeClock(root: HTMLElement) {
	const animate = Element.prototype.animate;
	let latest: Animation | undefined;
	const owned = new Map<Animation, number>();
	const spy = vi.spyOn(Element.prototype, 'animate').mockImplementation(function (
		this: Element,
		keyframes,
		options
	) {
		const animation = animate.call(this, keyframes, options);
		const duration = animation.effect?.getTiming().duration;
		if (
			root.contains(this) &&
			Array.isArray(keyframes) &&
			this.matches('.answer') &&
			typeof duration === 'number' &&
			duration > 0
		) {
			owned.set(animation, animation.playbackRate);
			latest = animation;
			animation.playbackRate = 0;
			animation.currentTime = 0;
		}
		return animation;
	});
	onTestFinished(() => {
		spy.mockRestore();
		for (const animation of owned.keys()) animation.cancel();
	});
	return {
		async after(action: () => void) {
			const previous = latest;
			flushSync(action);
			await expect.poll(() => latest !== previous).toBe(true);
			await latest!.ready;
			await frame();
			await frame();
			return latest!;
		},
		async seek(animation: Animation, fraction: number) {
			animation.currentTime = (animation.effect!.getTiming().duration as number) * fraction;
			// The clock drives Svelte's tick, which renders Motion values on its next frame.
			await frame();
			await frame();
		},
		release(animation: Animation) {
			animation.playbackRate = owned.get(animation)!;
		}
	};
}

for (const width of [360, 240]) {
	it(`accordion at ${width}px keeps trigger and answer text fixed at sampled height phases`, async () => {
		const view = render(Accordion);
		const root = view.container as HTMLElement;
		root.style.width = `${width}px`;
		await tick();
		await frame();
		const button = root.querySelector('button')!;
		const before = button.getBoundingClientRect();
		button.focus();
		flushSync(() => button.click());
		const answer = root.querySelector<HTMLElement>('.answer')!;
		await expect
			.poll(() => Boolean(visualElementStore.get(answer)?.getValue('height')?.animation))
			.toBe(true);
		const intro = visualElementStore.get(answer)!.getValue('height')!.animation;
		expect(intro).toBeInstanceOf(AsyncMotionValueAnimation);
		if (!(intro instanceof AsyncMotionValueAnimation))
			throw new Error('Expected Motion entry playback');
		// Entry uses Motion's driver; retained exits and reversals use Svelte's native clock.
		intro.pause();
		onTestFinished(() => intro.stop());
		const text = answer.querySelector('p')!;
		const origin = answer.getBoundingClientRect().top;
		const textOrigin = text.getBoundingClientRect().top;
		const opening: number[] = [];
		const assertGeometry = () => {
			near(button.getBoundingClientRect().height, before.height);
			near(button.getBoundingClientRect().top, before.top);
			near(answer.getBoundingClientRect().top, origin);
			near(text.getBoundingClientRect().top, textOrigin);
			expect(document.activeElement).toBe(button);
		};
		for (const phase of [0.15, 0.3, 0.45, 0.6, 0.75]) {
			intro.time = intro.duration * phase;
			await frame();
			assertGeometry();
			opening.push(answer.getBoundingClientRect().height);
		}
		intro.play();
		await expect.poll(() => answer.style.height).toBe('auto');
		const height = answer.getBoundingClientRect().height;
		expect(height).toBeGreaterThan(20);
		expect(answer.style.height).toBe('auto');
		expect(opening.filter((value) => value > 1 && value < height - 1).length).toBeGreaterThan(2);
		const clocks = controlNativeClock(root);
		const outro = await clocks.after(() => button.click());
		expect(answer.isConnected).toBe(true);
		const closing: number[] = [];
		for (const phase of [0.15, 0.3, 0.45, 0.6, 0.75]) {
			await clocks.seek(outro, phase);
			near(button.getBoundingClientRect().height, before.height);
			near(button.getBoundingClientRect().top, before.top);
			expect(answer.isConnected).toBe(true);
			assertGeometry();
			closing.push(answer.getBoundingClientRect().height);
		}
		expect(closing.filter((value) => value > 1 && value < height - 1).length).toBeGreaterThan(2);
		clocks.release(outro);
		await expect.poll(() => answer.isConnected).toBe(false);
		expect(root.querySelector('.answer')).toBeNull();
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(button);
	});
}

it('accordion reverses an active exit without replacing its answer or moving the trigger and text', async () => {
	const view = render(Accordion);
	const root = view.container as HTMLElement;
	await tick();
	const button = root.querySelector('button')!;
	const trigger = button.getBoundingClientRect();
	button.focus();
	button.click();
	await tick();
	const answer = root.querySelector<HTMLElement>('.answer')!;
	await expect.poll(() => answer.style.height).toBe('auto');
	const text = answer.querySelector('p')!;
	const textTop = text.getBoundingClientRect().top;
	const height = answer.getBoundingClientRect().height;
	const clocks = controlNativeClock(root);
	const outro = await clocks.after(() => button.click());
	await clocks.seek(outro, 0.4);
	const partial = answer.getBoundingClientRect().height;
	expect(partial).toBeGreaterThan(0);
	expect(partial).toBeLessThan(height * 0.8);
	const intro = await clocks.after(() => button.click());
	// Reversing a retained native branch must not restart it at initial height zero.
	near(answer.getBoundingClientRect().height, partial);
	let intermediate = 0;
	for (const phase of [0.15, 0.3, 0.45, 0.6, 0.75]) {
		await clocks.seek(intro, phase);
		expect(root.querySelector('.answer')).toBe(answer);
		near(button.getBoundingClientRect().height, trigger.height);
		near(button.getBoundingClientRect().top, trigger.top);
		near(text.getBoundingClientRect().top, textTop);
		const current = answer.getBoundingClientRect().height;
		if (current > partial + 1 && current < height - 1) intermediate++;
	}
	expect(intermediate).toBeGreaterThan(1);
	clocks.release(intro);
	await expect.poll(() => answer.style.height).toBe('auto');
	near(answer.getBoundingClientRect().height, height);
	expect(button.getAttribute('aria-expanded')).toBe('true');
	const finalExit = await clocks.after(() => button.click());
	clocks.release(finalExit);
	await expect.poll(() => answer.isConnected).toBe(false);
	expect(document.activeElement).toBe(button);
});

it('accordion plays naturally through opening, exit reversal and final cleanup', async () => {
	const view = render(Accordion);
	const root = view.container as HTMLElement;
	root.style.width = '240px';
	await tick();
	const button = root.querySelector('button')!;
	const trigger = button.getBoundingClientRect();
	button.focus();
	flushSync(() => button.click());
	const answer = root.querySelector<HTMLElement>('.answer')!;
	const text = answer.querySelector('p')!;
	const textTop = text.getBoundingClientRect().top;
	const heights: number[] = [];
	const geometry: { triggerTop: number; triggerHeight: number; textTop: number }[] = [];
	await expect.poll(() => visualElementStore.get(answer)?.getValue('height')).toBeDefined();
	const heightValue = visualElementStore.get(answer)!.getValue('height')!;
	let reversing = false;
	let reversed = false;
	let reverseHeight = 0;
	let fullHeight = 0;
	// Observe each actual render, avoiding a second RAF loop whose ordering can
	// miss the native tick. No clock, duration, playback rate or easing is changed.
	const stop = heightValue.on('change', () =>
		queueMicrotask(() => {
			if (!answer.isConnected) return;
			const height = answer.getBoundingClientRect().height;
			heights.push(height);
			geometry.push({
				triggerTop: button.getBoundingClientRect().top,
				triggerHeight: button.getBoundingClientRect().height,
				textTop: text.getBoundingClientRect().top
			});
			if (reversing && !reversed && height > 1 && height < fullHeight - 1) {
				reversed = true;
				reverseHeight = height;
				flushSync(() => button.click());
			}
		})
	);
	onTestFinished(stop);
	await expect.poll(() => answer.style.height).toBe('auto');
	fullHeight = answer.getBoundingClientRect().height;
	expect(heights.some((height) => height > 1 && height < fullHeight - 1)).toBe(true);
	heights.length = 0;
	reversing = true;
	flushSync(() => button.click());
	await expect.poll(() => reversed).toBe(true);
	await expect.poll(() => answer.style.height).toBe('auto');
	expect(root.querySelector('.answer')).toBe(answer);
	expect(reverseHeight).toBeGreaterThan(1);
	expect(reverseHeight).toBeLessThan(fullHeight - 1);
	expect(heights.some((height) => height > reverseHeight + 1 && height < fullHeight - 1)).toBe(
		true
	);
	heights.length = 0;
	expect(button.getAttribute('aria-expanded')).toBe('true');
	flushSync(() => button.click());
	await expect.poll(() => answer.isConnected).toBe(false);
	expect(heights.some((height) => height > 1 && height < fullHeight - 1)).toBe(true);
	for (const sample of geometry) {
		near(sample.triggerHeight, trigger.height);
		near(sample.triggerTop, trigger.top);
		near(sample.textTop, textTop);
	}
	expect(root.querySelector('.answer')).toBeNull();
	expect(button.getAttribute('aria-expanded')).toBe('false');
	expect(document.activeElement).toBe(button);
});
