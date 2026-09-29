import { expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore } from 'motion-dom';
import StateExample from '../site/examples/StateExample.svelte';

const pose = (node: HTMLElement) => {
	const style = getComputedStyle(node);
	const matrix = new DOMMatrix(style.transform);
	return { opacity: Number(style.opacity), y: matrix.f, scale: matrix.a };
};

function controlNativeClocks(node: HTMLElement) {
	const animate = node.animate.bind(node);
	const owned = new Map<Animation, number>();
	let controlled = true;
	let receive: ((animation: Animation) => void) | undefined;
	const spy = vi.spyOn(node, 'animate').mockImplementation((keyframes, options) => {
		const animation = animate(keyframes, options);
		const duration = animation.effect?.getTiming().duration;
		if (controlled && typeof duration === 'number' && duration > 0) {
			// Svelte ticks only running animations; rate zero holds its native clock
			// without terminating that tick loop as pause() would.
			owned.set(animation, animation.playbackRate);
			animation.playbackRate = 0;
			animation.currentTime = 0;
			const ready = receive;
			receive = undefined;
			ready?.(animation);
		}
		return animation;
	});
	onTestFinished(() => {
		spy.mockRestore();
		for (const animation of owned.keys()) animation.cancel();
	});
	return {
		next(action: () => void) {
			return new Promise<Animation>((resolve, reject) => {
				receive = (animation) => {
					void animation.ready.then(() => resolve(animation), reject);
				};
				flushSync(action);
			});
		},
		release(animation: Animation) {
			controlled = false;
			animation.playbackRate = owned.get(animation)!;
			animation.play();
		}
	};
}

// Sample the real native clock and wait for its resulting style render. The
// clock remains held at rate zero, so scheduling pressure cannot move the sample point.
function sample(node: HTMLElement, animation: Animation, time: number) {
	const opacity = visualElementStore.get(node)?.getValue('opacity');
	if (!opacity) throw new Error('Expected the native notification opacity MotionValue');
	return new Promise<ReturnType<typeof pose>>((resolve, reject) => {
		let active = true;
		let queued = false;
		let heldTime = animation.currentTime;
		const cleanup = () => {
			active = false;
			stop();
		};
		const stop = opacity.on('change', () => {
			if (queued) return;
			queued = true;
			// Native tick sets MotionValues, then renders the visual synchronously.
			// Observe after that render, not an unrelated queued style mutation.
			queueMicrotask(() => {
				if (!active) return;
				cleanup();
				try {
					expect(node.isConnected).toBe(true);
					expect(animation.currentTime).toBe(heldTime);
					resolve(pose(node));
				} catch (error) {
					reject(error);
				}
			});
		});
		onTestFinished(cleanup);
		animation.currentTime = Math.round(time);
		heldTime = animation.currentTime;
	});
}

async function samplePartial(
	node: HTMLElement,
	animation: Animation,
	direction: 'in' | 'out',
	lower: number,
	upper: number
) {
	const duration = animation.effect!.getTiming().duration as number;
	expect(duration).toBeGreaterThan(0);
	let from = 0;
	let to = duration;
	for (let step = 0; step < 20; step++) {
		const time = (from + to) / 2;
		const current = await sample(node, animation, time);
		if (current.opacity > lower && current.opacity < upper) {
			expect(time).toBeGreaterThan(0);
			expect(time).toBeLessThan(duration);
			return current;
		}
		if (current.opacity <= lower === (direction === 'in')) from = time;
		else to = time;
	}
	throw new Error(`Native ${direction} did not render opacity between ${lower} and ${upper}`);
}

function dismissNaturally(node: HTMLElement, button: HTMLButtonElement) {
	return new Promise<void>((resolve, reject) => {
		let completed = false;
		const onOutroEnd = () => {
			completed = true;
		};
		const cleanup = () => {
			observer.disconnect();
			node.removeEventListener('outroend', onOutroEnd);
		};
		const observer = new MutationObserver(() => {
			if (node.isConnected) return;
			cleanup();
			try {
				expect(completed).toBe(true);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
		onTestFinished(cleanup);
		observer.observe(node.parentElement!, { childList: true });
		node.addEventListener('outroend', onOutroEnd);
		flushSync(() => button.click());
	});
}

for (const repetitions of [1, 5]) {
	it(`restores the same notification after ${repetitions} interrupted exits and still removes it on dismissal`, async () => {
		await render(StateExample);
		const node = document.querySelector<HTMLElement>('.notification')!;
		const button = document.querySelector<HTMLButtonElement>('.state-example button')!;
		await expect.poll(() => pose(node).opacity).toBeCloseTo(1, 3);
		const clocks = controlNativeClocks(node);
		for (let i = 0; i < repetitions; i++) {
			const exit = await clocks.next(() => button.click());
			const exiting = await samplePartial(node, exit, 'out', 0.2, 0.8);
			expect(exiting.opacity).toBeGreaterThan(0.2);
			expect(exiting.opacity).toBeLessThan(0.8);
			expect(node.inert).toBe(true);
			const intro = await clocks.next(() => button.click());
			expect(document.querySelector('.notification')).toBe(node);
			const restored = await sample(node, intro, 1);
			expect(Math.abs(restored.opacity - exiting.opacity)).toBeLessThan(0.2);
			if (i + 1 < repetitions) {
				const progressing = await samplePartial(node, intro, 'in', 0.8, 0.95);
				expect(progressing.opacity).toBeGreaterThan(restored.opacity);
				expect(progressing.opacity).toBeLessThan(0.95);
				expect(node.inert).toBe(false);
			} else clocks.release(intro);
		}
		await expect.poll(() => pose(node).opacity).toBeCloseTo(1, 3);
		await expect.poll(() => pose(node).y).toBeCloseTo(0, 2);
		await expect.poll(() => pose(node).scale).toBeCloseTo(1, 3);
		expect(node.inert).toBe(false);
		expect(button.getAttribute('aria-pressed')).toBe('true');
		await dismissNaturally(node, button);
		expect(node.isConnected).toBe(false);
		flushSync(() => button.click());
		await expect.poll(() => document.querySelector('.notification')).not.toBeNull();
		const replacement = document.querySelector<HTMLElement>('.notification')!;
		expect(replacement).not.toBe(node);
		await expect.poll(() => pose(replacement).opacity).toBeCloseTo(1, 3);
	});
}
