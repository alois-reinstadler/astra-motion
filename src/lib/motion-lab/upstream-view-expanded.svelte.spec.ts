// Motion v13.4.4, 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Source mapping and attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AnimationPlaybackControls } from '../motion/index.js';
import Fixture from './UpstreamViewExpanded.svelte';
const effects = () =>
	document
		.getAnimations()
		.map((a) => a.effect as KeyframeEffect)
		.filter((e) => e.pseudoElement?.includes('astra_view_'));
for (const custom of [false, true])
	for (const kind of ['enter', 'exit', 'update', 'share'] as const)
		it(`view-layer-timing: ${kind} ${custom ? 'custom' : 'default'} layers use configured timing`, async () => {
			let controls: AnimationPlaybackControls | undefined;
			const complete = vi.fn();
			const start = vi.fn((value: AnimationPlaybackControls) => {
				controls = value;
				value.pause();
			});
			const view = render(Fixture, { custom, onStart: start, onComplete: complete });
			await tick();
			// Arrange enter without taking a paused native capture.
			if (kind === 'enter') {
				const initial = view.component.change('exit');
				await initial.ready;
				controls?.complete();
				await initial.finished;
				start.mockClear();
				complete.mockClear();
				controls = undefined;
			}
			const handle = view.component.change(kind);
			try {
				await handle.ready;
				if (typeof document.startViewTransition === 'function') {
					expect(start).toHaveBeenCalledTimes(1);
					const layers = effects();
					expect(layers.length).toBeGreaterThan(0);
					for (const layer of layers) {
						expect(layer.getTiming().duration).toBe(400);
						expect(layer.getTiming().easing).toBe('linear');
					}
					if (custom) {
						const styled = layers.filter((e) => e.getKeyframes().some((f) => f.clipPath));
						expect(styled).toHaveLength(1);
						const nonGroup = layers.filter(
							(effect) => !effect.pseudoElement?.startsWith('::view-transition-group(')
						);
						expect(nonGroup).toHaveLength(1);
						expect(nonGroup[0]).toBe(styled[0]);
						expect(nonGroup[0].pseudoElement).toMatch(
							new RegExp(`^::view-transition-${kind === 'enter' ? 'new' : 'old'}\\(`)
						);
					}
					controls!.complete();
					await expect(handle.finished).resolves.toBe('finished');
					expect(complete).toHaveBeenCalledExactlyOnceWith(kind);
				} else {
					await expect(handle.finished).resolves.toBe('unsupported');
					expect(start).not.toHaveBeenCalled();
					expect(complete).not.toHaveBeenCalled();
				}
				const target = document.querySelector<HTMLElement>('[data-expanded-view]');
				if (kind === 'exit') expect(target).toBeNull();
				else {
					expect(target).not.toBeNull();
					if (kind === 'share') expect(target!.offsetWidth).toBe(200);
					if (kind === 'update') expect(target!.textContent).toBe('1');
				}
			} finally {
				handle.cancel();
				await view.unmount();
			}
		});
it('view-custom-shared-morph: custom crossfade preserves a timed browser group morph', async () => {
	let controls: AnimationPlaybackControls | undefined;
	const complete = vi.fn();
	const view = render(Fixture, {
		custom: true,
		onStart: (c) => {
			controls = c;
			c.pause();
		},
		onComplete: complete
	});
	await tick();
	const before = document.querySelector<HTMLElement>('[data-expanded-view]')!.offsetWidth;
	const handle = view.component.change('share');
	try {
		await handle.ready;
		if (typeof document.startViewTransition === 'function') {
			const layers = effects();
			const groups = layers.filter((e) => e.pseudoElement?.startsWith('::view-transition-group('));
			const custom = layers.filter((e) => e.getKeyframes().some((f) => f.clipPath));
			expect(groups).toHaveLength(1);
			expect(custom).toHaveLength(1);
			const nonGroup = layers.filter(
				(effect) => !effect.pseudoElement?.startsWith('::view-transition-group(')
			);
			expect(nonGroup).toHaveLength(1);
			expect(nonGroup[0]).toBe(custom[0]);
			expect(nonGroup[0].pseudoElement).toMatch(/^::view-transition-old\(/);
			expect(groups[0].getTiming().duration).toBe(400);
			expect(groups[0].getTiming().easing).toBe('linear');
			expect(custom[0].getTiming().duration).toBe(400);
			controls!.complete();
			await handle.finished;
			expect(complete).toHaveBeenCalledExactlyOnceWith('share');
		} else {
			await expect(handle.finished).resolves.toBe('unsupported');
			expect(complete).not.toHaveBeenCalled();
		}
		expect(
			document.querySelector<HTMLElement>('[data-expanded-view]')!.offsetWidth
		).toBeGreaterThan(before);
	} finally {
		handle.cancel();
		await view.unmount();
	}
});
