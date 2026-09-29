import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { animateTarget, HTMLVisualElement, visualElementStore } from 'motion-dom';
import { createPresenceTimeline } from '../motion/presence-state.js';
import Fixture from './RCNativeIntrinsic.svelte';
import ExitOptions from './RCNativeExitOptions.svelte';
import InfiniteReentry from './RCNativeInfiniteReentry.svelte';

const panels = () =>
	['native', 'component'].map((kind) =>
		document.querySelector<HTMLElement>(`[data-intrinsic="${kind}"]`)!
	);
for (const axis of ['height', 'width'] as const) {
	for (const boxSizing of ['content-box', 'border-box'] as const) {
		it(`removes equivalent ${boxSizing} native/component ${axis}:auto panels after entry settles`, async () => {
			const { component } = render(Fixture, { axis, boxSizing });
			await expect.poll(() => panels().map((node) => node.style[axis])).toEqual(['auto', 'auto']);
			const nodes = panels();
			const sizes = nodes.map((node) => node.getBoundingClientRect()[axis]);
			expect(sizes[0]).toBeCloseTo(sizes[1], 2);
			expect(sizes[0]).toBeGreaterThan(0);
			flushSync(() => component.show(false));
			expect(nodes.every((node) => node.isConnected)).toBe(true);
			await expect
				.poll(() => nodes[0].getBoundingClientRect()[axis], { interval: 10 })
				.toBeLessThan(sizes[0]);
			expect(nodes[0].isConnected).toBe(true);
			await expect.poll(() => nodes.some((node) => node.isConnected)).toBe(false);
		});
	}
}
it('reverses an intrinsic native exit on the same element and restores auto sizing', async () => {
	const { component } = render(Fixture);
	await expect.poll(() => panels().map((node) => node.style.height)).toEqual(['auto', 'auto']);
	const nodes = panels();
	const initial = nodes[0].getBoundingClientRect().height;
	flushSync(() => component.show(false));
	await expect
		.poll(() => nodes[0].getBoundingClientRect().height, { interval: 10 })
		.toBeLessThan(initial * 0.8);
	expect(nodes[0].isConnected).toBe(true);
	flushSync(() => component.show(true));
	expect(panels()).toEqual(nodes);
	await expect.poll(() => nodes.map((node) => node.style.height)).toEqual(['auto', 'auto']);
	expect(nodes[0].getBoundingClientRect().height).toBeCloseTo(initial, 2);
	flushSync(() => component.show(false));
	await expect.poll(() => nodes.some((node) => node.isConnected)).toBe(false);
});
it('finishes a retained native exit when Activity becomes inactive during it', async () => {
	const { component } = render(Fixture);
	await expect.poll(() => panels()[0].style.height).toBe('auto');
	const node = panels()[0];
	flushSync(() => component.show(false));
	await expect.poll(() => Number(node.style.opacity), { interval: 10 }).toBeLessThan(0.9);
	flushSync(() => component.suspend());
	await expect.poll(() => node.isConnected).toBe(false);
});
it('settles intrinsic native exits under always-reduced motion', async () => {
	const { component } = render(Fixture, { reducedMotion: 'always' });
	await expect.poll(() => panels()[0].style.height).toBe('auto');
	const nodes = panels();
	flushSync(() => component.show(false));
	await expect.poll(() => nodes.some((node) => node.isConnected)).toBe(false);
});
it('measures a modern intrinsic exit without resolving another element pending entry', () => {
	const nodes = [document.createElement('div'), document.createElement('div')];
	const visuals = nodes.map((node, index) => {
		node.style.cssText = `height:${index ? '30px' : 'auto'};width:100px`;
		node.innerHTML = '<p style="height:100px;margin:0">Intrinsic content</p>';
		document.body.append(node);
		const visual = new HTMLVisualElement({
			presenceContext: null,
			props: {},
			visualState: {
				latestValues: { height: index ? 30 : 'auto' },
				renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
			}
		});
		visual.mount(node);
		return visual;
	});
	const readStyle = window.getComputedStyle;
	let unrelatedReads = 0;
	window.getComputedStyle = (node, pseudo) => {
		if (node === nodes[1]) unrelatedReads++;
		return readStyle.call(window, node, pseudo);
	};
	try {
		animateTarget(visuals[1], { height: 'auto', transition: { duration: 1 } });
		const trajectory = createPresenceTimeline(
			visuals[0],
			{ height: 'auto' },
			{ height: 0 },
			{ duration: 0.2 },
			'out',
			{},
			undefined,
			false
		);
		expect(unrelatedReads).toBe(0);
		trajectory.finish();
		expect(nodes[0].style.height).toBe('0px');
	} finally {
		window.getComputedStyle = readStyle;
		visuals.forEach((visual) => {
			visual.values.forEach((value) => value.stop());
			visual.unmount();
		});
		nodes.forEach((node) => node.remove());
	}
});

for (const scenario of ['variables', 'repeat', 'keyframes'] as const) {
	it(`completes equivalent modern native/component ${scenario} exits`, async () => {
		const { component } = render(ExitOptions, { scenario });
		const nodes = ['native', 'component'].map((kind) =>
			document.querySelector<HTMLElement>(`[data-exit-options="${kind}"]`)!
		);
		await expect
			.poll(() => nodes.map((node) => Number(getComputedStyle(node).opacity)))
			.toEqual([1, 1]);
		flushSync(() => component.close());
		expect(nodes.every((node) => node.isConnected)).toBe(true);
		// Three 300ms iterations plus two 50ms repeat gaps exceed the default 1s poll budget.
		await expect.poll(() => nodes.some((node) => node.isConnected), { timeout: 3000 }).toBe(false);
		expect(component.exits()).toEqual({ native: true, component: true });
	});
}

for (const repeatType of ['loop', 'reverse', 'mirror'] as const) {
	it(`includes all finite ${repeatType} iterations and delays in the native retention clock`, () => {
		const node = document.createElement('div');
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
			const timeline = createPresenceTimeline(
				visual,
				{ opacity: 1 },
				{ opacity: 0 },
				{ duration: 0.1, delay: 0.02, repeat: 1, repeatDelay: 0.05, repeatType, ease: 'linear' },
				'out',
				{},
				undefined,
				false
			);
			expect(timeline.span).toBeCloseTo(270, 4);
			timeline.tick?.(1, 0);
			timeline.tick?.(1 - 70 / 270, 70 / 270);
			expect(Number(node.style.opacity)).toBeCloseTo(0.5, 3);
			timeline.tick?.(1 - 195 / 270, 195 / 270);
			expect(Number(node.style.opacity)).toBeCloseTo(repeatType === 'loop' ? 0.75 : 0.25, 3);
			timeline.tick?.(0, 1);
			expect(Number(node.style.opacity)).toBe(repeatType === 'loop' ? 0 : 1);
		} finally {
			visual.unmount();
			node.remove();
		}
	});
}

it('honors explicit modern first keyframes, CSS-variable final values, and rejects infinite retention', () => {
	const node = document.createElement('div');
	node.style.setProperty('--exit-opacity', '0.2');
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
		const explicit = createPresenceTimeline(
			visual,
			{ opacity: 1 },
			{ opacity: [0.3, 0] },
			{ duration: 0.2 },
			'out',
			{},
			undefined,
			false
		);
		explicit.tick?.(1, 0);
		expect(Number(node.style.opacity)).toBe(0.3);
		explicit.cancel();
		const variable = createPresenceTimeline(
			visual,
			{ opacity: 0.3 },
			{ opacity: 'var(--exit-opacity)' },
			{ duration: 0.2 },
			'out',
			{},
			undefined,
			false
		);
		variable.finish();
		expect(node.style.opacity).toBe('var(--exit-opacity)');
		expect(Number(getComputedStyle(node).opacity)).toBe(0.2);
		expect(() =>
			createPresenceTimeline(
				visual,
				{ opacity: 0.2 },
				{ opacity: 0 },
				{ repeat: Infinity },
				'out',
				{},
				undefined,
				false
			)
		).toThrow('infinite repeat cannot complete an outro');
	} finally {
		visual.unmount();
		node.remove();
	}
});

it('measures relative width and intrinsic height together before sampling their exit', () => {
	const host = document.createElement('div');
	host.style.width = '200px';
	const node = document.createElement('div');
	node.textContent = 'Wrapped text content '.repeat(10);
	node.style.cssText = 'width:50%;height:auto;line-height:20px';
	host.append(node);
	document.body.append(host);
	const targetHeight = parseFloat(getComputedStyle(node).height);
	node.style.width = '200px';
	node.style.height = '40px';
	const visual = new HTMLVisualElement({
		presenceContext: null,
		props: {},
		visualState: {
			latestValues: { width: 200, height: 40 },
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	try {
		const timeline = createPresenceTimeline(
			visual,
			{ width: 200, height: 40 },
			{ width: '50%', height: 'auto' },
			{ duration: 1, ease: 'linear' },
			'out',
			{},
			undefined,
			false
		);
		timeline.tick?.(1, 0);
		timeline.tick?.(0.5, 0.5);
		expect(parseFloat(node.style.width)).toBeCloseTo(150, 3);
		expect(parseFloat(node.style.height)).toBeCloseTo((40 + targetHeight) / 2, 3);
		timeline.finish();
		expect(node.style.width).toBe('50%');
		expect(node.style.height).toBe('auto');
	} finally {
		visual.unmount();
		host.remove();
	}
});

it('preserves legacy fill-before-source-override for explicit first frames followed by null', () => {
	const node = document.createElement('div');
	const visual = new HTMLVisualElement({
		presenceContext: null,
		props: {},
		visualState: {
			latestValues: { x: 0 },
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	try {
		const timeline = createPresenceTimeline(
			visual,
			{ x: 0 },
			{ x: [100, null, 200] },
			{ duration: 1, ease: 'linear' },
			'out'
		);
		timeline.tick?.(1, 0);
		timeline.tick?.(0.5, 0.5);
		expect(visual.getValue('x')?.get()).toBe(100);
		timeline.cancel();
	} finally {
		visual.unmount();
	}
});
for (const repeatType of ['reverse', 'mirror'] as const) {
	for (const instant of [{ duration: 0 }, { skipAnimations: true }, { type: false }] as const) {
		it(`preserves the odd ${repeatType} endpoint when playback is suppressed by ${Object.keys(instant)[0]}`, () => {
			const node = document.createElement('div');
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
				const timeline = createPresenceTimeline(
					visual,
					{ opacity: 1 },
					{ opacity: 0 },
					{ repeat: 1, repeatType, ...instant },
					'out',
					{},
					undefined,
					false
				);
				expect(timeline.span).toBe(0);
				expect(Number(node.style.opacity)).toBe(1);
			} finally {
				visual.unmount();
				node.remove();
			}
		});
	}
}
for (const initial of [false, { opacity: 0 }] as const) {
	it(`resumes infinite while-present playback on the same native/component roots after finite exit reversal (initial=${Boolean(initial)})`, async () => {
		const { component } = render(InfiniteReentry, { initial });
		const nodes = ['native', 'component'].map((kind) =>
			document.querySelector<HTMLElement>(`[data-infinite-reentry="${kind}"]`)!
		);
		await expect
			.poll(() => nodes.every((node) => Number(getComputedStyle(node).opacity) > 0.5))
			.toBe(true);
		flushSync(() => component.show(false));
		await expect
			.poll(() => nodes.every((node) => Number(getComputedStyle(node).opacity) < 0.5), {
				interval: 10
			})
			.toBe(true);
		expect(nodes.every((node) => node.isConnected)).toBe(true);
		flushSync(() => component.show(true));
		await expect
			.poll(() =>
				nodes.map((node) => visualElementStore.get(node)?.getValue('opacity')?.animation?.state)
			)
			.toEqual(['running', 'running']);
		await expect
			.poll(() =>
				nodes.every((node) => {
					const control = visualElementStore.get(node)?.getValue('opacity')?.animation;
					return (
						control && 'time' in control && typeof control.time === 'number' && control.time > 0.36
					);
				})
			)
			.toBe(true);
		expect(nodes.every((node) => node.isConnected)).toBe(true);
		for (const node of nodes)
			node.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		await expect
			.poll(() => nodes.map((node) => visualElementStore.get(node)?.getValue('scale')?.get()))
			.toEqual([1.1, 1.1]);
		flushSync(() => component.show(false));
		await expect.poll(() => nodes.some((node) => node.isConnected)).toBe(false);
	});
}
it('does not start stale infinite playback after rapid out-in-out before the handoff microtask', async () => {
	const { component } = render(InfiniteReentry);
	const nodes = ['native', 'component'].map((kind) =>
		document.querySelector<HTMLElement>(`[data-infinite-reentry="${kind}"]`)!
	);
	await expect
		.poll(() => nodes.every((node) => Number(getComputedStyle(node).opacity) === 1))
		.toBe(true);
	flushSync(() => component.show(false));
	await expect
		.poll(() => nodes.every((node) => Number(getComputedStyle(node).opacity) < 0.5), {
			interval: 10
		})
		.toBe(true);
	flushSync(() => component.show(true));
	flushSync(() => component.show(false));
	await expect.poll(() => nodes.some((node) => node.isConnected)).toBe(false);
	// Motion keeps weak lookup metadata; disposal clears the visual's mounted target.
	await expect
		.poll(() => nodes.every((node) => visualElementStore.get(node)?.current == null))
		.toBe(true);
	expect(
		nodes.every(
			(node) => visualElementStore.get(node)?.getValue('opacity')?.animation?.state !== 'running'
		)
	).toBe(true);
});
