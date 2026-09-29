import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './PopResize.svelte';
import {
	AsyncMotionValueAnimation,
	cancelFrame,
	frame as motionFrame,
	visualElementStore,
	type AnimationPlaybackControls
} from 'motion-dom';
import { beforeCommit } from '../motion/commit.js';

const frames = async (count = 2) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const text = () => document.querySelector<HTMLElement>('[data-pop-resize-text]')!;
const sibling = () => document.querySelector<HTMLElement>('[data-pop-resize-sibling]')!;
const lines = (node: HTMLElement) => {
	const range = document.createRange();
	range.selectNodeContents(node);
	return [...range.getClientRects()].map(({ width, height }) => ({ width, height }));
};

// Projection's microtask update flushes update/preRender/render, without
// postRender. Capture in preRender immediately after the clock is created.
function pauseProjectionStarts(nodes: HTMLElement[]) {
	const previous = nodes.map((node) => visualElementStore.get(node)?.projection?.currentAnimation);
	const animations: AnimationPlaybackControls[] = [];
	const capture = () => {
		for (const [index, node] of nodes.entries()) {
			const animation = visualElementStore.get(node)?.projection?.currentAnimation;
			if (!animation || animation === previous[index] || animations.includes(animation)) continue;
			animation.pause();
			animations.push(animation);
		}
	};
	motionFrame.preRender(capture, true);
	return { animations, stop: () => cancelFrame(capture) };
}

for (const transaction of [false, true]) {
	it(`preserves outgoing wrapping through simultaneous ancestor resize (${transaction ? 'transaction' : 'automatic'})`, async () => {
		const { component } = render(Fixture, { transaction });
		await frames();
		const original = text();
		const before = original.getBoundingClientRect();
		const wrapping = lines(original);
		const siblingBefore = sibling().offsetTop;
		flushSync(() => component.toggle());
		await tick();
		await expect.poll(() => getComputedStyle(original).position).toBe('absolute');
		const popped = original.getBoundingClientRect();
		expect(popped.width).toBeCloseTo(before.width, 1);
		expect(popped.height).toBeCloseTo(before.height, 1);
		expect(popped.top).toBeCloseTo(before.top, 1);
		expect(popped.left).toBeCloseTo(before.left, 1);
		expect(lines(original)).toEqual(wrapping);
		expect(sibling().offsetTop).toBeLessThan(siblingBefore);
		flushSync(() => component.toggle());
		await frames();
		expect(text()).toBe(original);
		expect(original.hasAttribute('data-astra-presence-pop')).toBe(false);
		expect(getComputedStyle(original).position).toBe('static');
		flushSync(() => component.toggle());
		await tick();
		component.complete();
		await expect.poll(text).toBeNull();
	});
}

it('refreshes present geometry after resize and releases snapshot subscriptions on disposal', async () => {
	const subscriptions = beforeCommit.size;
	const screen = render(Fixture);
	await frames();
	flushSync(() => screen.component.resize(260));
	await frames();
	const before = text().getBoundingClientRect();
	expect(before.width).toBe(260);
	flushSync(() => screen.component.toggle());
	await tick();
	expect(text().getBoundingClientRect().width).toBeCloseTo(before.width, 1);
	await screen.unmount();
	expect(beforeCommit.size).toBe(subscriptions);
	expect(document.querySelector('[data-astra-presence-pop]')).toBeNull();
});

it('captures an intervening synchronous resize at the explicit transaction boundary', async () => {
	const { component } = render(Fixture, { transaction: true });
	await frames();
	flushSync(() => component.resize(260));
	// Deliberately do not yield to observers between this resize and the exit.
	flushSync(() => component.toggle());
	await tick();
	expect(text().offsetWidth).toBe(260);
	expect(getComputedStyle(text()).position).toBe('absolute');
});

it('keeps local offsets correct after scrolling before exit', async () => {
	const scroller = document.createElement('div');
	scroller.style.cssText = 'height:140px;overflow:auto';
	const target = document.createElement('div');
	target.style.cssText = 'padding-top:100px;padding-bottom:600px';
	scroller.append(target);
	document.body.append(scroller);
	const screen = render(Fixture, { target });
	try {
		await frames();
		scroller.scrollTop = 110;
		const before = text().getBoundingClientRect();
		flushSync(() => screen.component.toggle());
		await tick();
		expect(text().getBoundingClientRect().top).toBeCloseTo(before.top, 1);
		expect(text().getBoundingClientRect().width).toBeCloseTo(before.width, 1);
		expect(scroller.scrollTop).toBe(110);
	} finally {
		await screen.unmount();
		scroller.remove();
	}
});

for (const direction of ['ltr', 'rtl'] as const) {
	it(`retains the selected right/bottom anchor through resize (${direction})`, async () => {
		const { component } = render(Fixture, { anchorX: 'right', anchorY: 'bottom', direction });
		await frames();
		const parent = document.querySelector<HTMLElement>('[data-pop-resize-parent]')!;
		const before = text().getBoundingClientRect();
		const parentBefore = parent.getBoundingClientRect();
		const gap =
			direction === 'rtl' ? before.left - parentBefore.left : parentBefore.right - before.right;
		const bottom = parentBefore.bottom - before.bottom;
		flushSync(() => component.toggle());
		await tick();
		const after = text().getBoundingClientRect();
		const parentAfter = parent.getBoundingClientRect();
		expect(after.width).toBeCloseTo(before.width, 1);
		expect(
			direction === 'rtl' ? after.left - parentAfter.left : parentAfter.right - after.right
		).toBeCloseTo(gap, 1);
		expect(parentAfter.bottom - after.bottom).toBeCloseTo(bottom, 1);
	});
}

it.each([
	{ interrupted: false, transaction: false },
	{ interrupted: true, transaction: false },
	{ interrupted: false, transaction: true },
	{ interrupted: true, transaction: true }
])(
	'preserves text and parent continuity during shrink (interrupted=$interrupted, transaction=$transaction)',
	async ({ interrupted, transaction }) => {
		const screen = render(Fixture, { projected: true, transaction });
		const { component } = screen;
		const cleanups: (() => void)[] = [];
		try {
			await frames();
			const parent = document.querySelector<HTMLElement>('[data-pop-resize-parent]')!;
			// Projection deliberately blocks during resize; wait for that lifecycle
			// rather than assuming a fixed setup delay outlasts it.
			await expect
				.poll(() => visualElementStore.get(parent)?.projection?.root.isUpdateBlocked())
				.toBe(false);
			if (interrupted) {
				const opening = pauseProjectionStarts([parent]);
				cleanups.push(opening.stop);
				flushSync(() => component.resize(440));
				await expect.poll(() => opening.animations.length).toBe(1);
				opening.stop();
				const animation = opening.animations[0];
				expect(animation).toBeDefined();
				animation.time = 0.3;
				await frames();
			}
			const original = text();
			const before = original.getBoundingClientRect();
			const parentBefore = parent.getBoundingClientRect();
			const intrinsicWidth = original.offsetWidth;
			const wrapping = lines(original);
			const visual = visualElementStore.get(original)!;
			let exit: AsyncMotionValueAnimation<number> | undefined;
			const captureExit = () => {
				const animation = visual.getValue('opacity')?.animation;
				if (!(animation instanceof AsyncMotionValueAnimation)) return;
				// Observe the value created by the exit itself. Do not seed an
				// opacity value before Motion reads its actual DOM origin.
				exit = animation;
				exit.pause();
				cancelFrame(captureExit);
			};
			// The exit has its own clock: pausing projection alone still allows
			// opacity to finish and remove the node while geometry is sampled.
			// Use the phase flushed by both projection commits and normal frames.
			motionFrame.preRender(captureExit, true);
			cleanups.push(() => cancelFrame(captureExit));
			const closing = pauseProjectionStarts([parent, original]);
			cleanups.push(closing.stop);
			flushSync(() => component.toggle());
			await tick();
			// Managed exits must freeze the intrinsic box before the next frame callback.
			expect(original.offsetWidth).toBe(intrinsicWidth);
			await expect.poll(() => closing.animations.length).toBeGreaterThan(0);
			await frames();
			closing.stop();
			const { animations } = closing;
			expect(animations.length).toBeGreaterThan(0);
			expect(exit).toBeInstanceOf(AsyncMotionValueAnimation);
			for (const time of [0, 0.2, 0.4, 0.6]) {
				for (const animation of animations) animation.time = time;
				exit!.time = time;
				await frames();
				expect(original.isConnected).toBe(true);
				const current = original.getBoundingClientRect();
				expect(current.width, `width at ${time}`).toBeCloseTo(before.width, 0);
				expect(current.height, `height at ${time}`).toBeCloseTo(before.height, 0);
				if (time === 0) {
					expect(current.left).toBeCloseTo(before.left, 0);
					expect(current.top).toBeCloseTo(before.top, 0);
					expect(parent.getBoundingClientRect().width).toBeCloseTo(parentBefore.width, 0);
					expect(parent.getBoundingClientRect().height).toBeCloseTo(parentBefore.height, 0);
				} else {
					expect(parent.getBoundingClientRect().width).toBeLessThan(parentBefore.width - 1);
					expect(parent.getBoundingClientRect().width).toBeGreaterThan(parent.offsetWidth + 1);
				}
				const currentLines = lines(original);
				expect(currentLines.length).toBe(wrapping.length);
				for (let index = 0; index < wrapping.length; index++)
					expect(currentLines[index].width).toBeCloseTo(wrapping[index].width, 0);
			}
			for (const cleanup of cleanups) cleanup();
			flushSync(() => component.toggle());
			await frames();
			expect(text()).toBe(original);
			expect(original.hasAttribute('data-astra-presence-pop')).toBe(false);
			for (const animation of animations) animation.complete();
		} finally {
			for (const cleanup of cleanups) cleanup();
			// Unmount owns the paused exit and any interrupted projection clocks.
			await screen.unmount();
		}
	}
);

it('uses the same snapshots for retained Activity roots', async () => {
	const { component } = render(Fixture, { activity: true });
	await frames();
	const original = text();
	const before = original.getBoundingClientRect();
	flushSync(() => component.toggle());
	await expect.poll(() => getComputedStyle(original).position).toBe('absolute');
	expect(original.getBoundingClientRect().width).toBeCloseTo(before.width, 1);
	expect(original.getBoundingClientRect().top).toBeCloseTo(before.top, 1);
	component.complete();
	await expect.poll(() => original.checkVisibility()).toBe(false);
	flushSync(() => component.toggle());
	await frames();
	expect(text()).toBe(original);
	expect(original.checkVisibility()).toBe(true);
	expect(original.hasAttribute('data-astra-presence-pop')).toBe(false);
});

it('does not measure present roots on paint-only frames', async () => {
	render(Fixture);
	await frames();
	const original = text();
	const computed = vi.spyOn(window, 'getComputedStyle');
	try {
		for (let index = 0; index < 5; index++) {
			original.style.opacity = String(1 - index / 10);
			original.style.transform = `translateX(${index}px)`;
			await frames(1);
		}
		expect(computed.mock.calls.filter(([node]) => node === original)).toHaveLength(0);
	} finally {
		computed.mockRestore();
	}
});
