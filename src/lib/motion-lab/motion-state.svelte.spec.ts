import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import { visualElementStore, type AnimationPlaybackControls } from 'motion-dom';
import MotionState from './MotionState.svelte';
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
};
const microtasks = async () => {
	for (let i = 0; i < 12; i++) await Promise.resolve();
};

it('uses one VisualElement for initial state, keyframe updates, and layout projection', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('motion-state').element() as HTMLElement;
	expect(node.style.opacity).toBe('0');
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	const visual = visualElementStore.get(node)!;
	expect(visual.projection).toBeDefined();
	expect(visual.getValue('scale')!.get()).toBe(1);
	await screen.getByRole('button', { name: 'Change motion state' }).click();
	await expect.poll(() => Number(visual.getValue('scale')!.get())).toBeCloseTo(0.9, 3);
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	expect(visualElementStore.get(node)).toBe(visual);
	expect(node.getBoundingClientRect().width).toBeCloseTo(90, 0);
});

it('preserves a native node through asymmetric presence reversals and removes it after exit', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('motion-state').element() as HTMLElement;
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	const visual = visualElementStore.get(node)!;
	const toggle = screen
		.getByRole('button', { name: 'Toggle motion state' })
		.element() as HTMLButtonElement;
	for (let index = 0; index < 6; index++) {
		const before = Number(visual.getValue('scale')!.get());
		flushSync(() => toggle.click());
		await microtasks();
		expect(node.isConnected).toBe(true);
		expect(Math.abs(Number(visual.getValue('scale')!.get()) - before)).toBeLessThan(0.001);
		await frames();
	}
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	flushSync(() => toggle.click());
	await expect.poll(() => node.isConnected).toBe(false);
});

it('binds an external MotionValue to the actual element transform', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('motion-value').element() as HTMLElement;
	await frames();
	screen.component.setExternal(72);
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(72, 3);
	expect(visualElementStore.get(node)!.getValue('x')!.get()).toBe(72);
});

it('resolves a dynamic custom variant again when custom changes', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('motion-custom').element() as HTMLElement;
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(20, 3);
	await screen.getByRole('button', { name: 'Change variant custom' }).click();
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(40, 3);
});

it('inherits variant labels through the actual VisualElement parent tree', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('motion-child').element() as HTMLElement;
	await frames();
	const parent = screen.getByTestId('motion-parent').element() as HTMLElement;
	expect(visualElementStore.get(node)!.parent).toBe(visualElementStore.get(parent));
	expect(visualElementStore.get(parent)!.variantChildren?.has(visualElementStore.get(node)!)).toBe(
		true
	);
	await screen.getByRole('button', { name: 'Toggle inherited variant' }).click();
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(50, 3);
	await screen.getByRole('button', { name: 'Toggle inherited variant' }).click();
	await expect.poll(() => new DOMMatrix(getComputedStyle(node).transform).e).toBeCloseTo(0, 3);
});

it('does not restore an exiting node when reduced motion changes during its retained outro', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('motion-state').element() as HTMLElement;
	await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(1, 3);
	flushSync(() =>
		(
			screen.getByRole('button', { name: 'Toggle motion state' }).element() as HTMLButtonElement
		).click()
	);
	await frames();
	flushSync(() =>
		(
			screen.getByRole('button', { name: 'Toggle reduced state' }).element() as HTMLButtonElement
		).click()
	);
	await microtasks();
	expect(Number(node.style.opacity)).toBe(0);
	await frames();
	expect(Number(node.style.opacity)).toBe(0);
	await expect.poll(() => node.isConnected).toBe(false);
});

it('runs inherited children after their parent and preserves Motion stagger ordering', async () => {
	const screen = render(MotionState);
	await frames();
	const parent = visualElementStore.get(screen.getByTestId('motion-parent').element())!;
	const first = visualElementStore.get(screen.getByTestId('motion-child').element())!;
	const second = visualElementStore.get(screen.getByTestId('motion-second-child').element())!;
	const controls: AnimationPlaybackControls[] = [];
	const parentAtChildStart: number[] = [];
	const stops = [first, second].map((visual, index) =>
		visual.getValue('x', 0).on('animationStart', () => {
			const animation = visual.getValue('x')!.animation;
			if (!animation || controls[index]) return;
			controls[index] = animation;
			parentAtChildStart[index] = Number(parent.getValue('opacity')!.get());
		})
	);
	try {
		await screen.getByRole('button', { name: 'Toggle inherited variant' }).click();
		await expect.poll(() => Number(second.getValue('x')!.get())).toBeCloseTo(50, 3);
		expect(controls).toHaveLength(2);
		expect(controls[1].iterationDuration - controls[0].iterationDuration).toBeCloseTo(0.12, 4);
		expect(parentAtChildStart[0]).toBeCloseTo(1, 3);
		expect(parentAtChildStart[1]).toBeCloseTo(1, 3);
	} finally {
		stops.forEach((stop) => stop());
	}
});

it.each([0, 1, 2])(
	'reverses inherited labels without delayed stale targets (pass %i)',
	async () => {
		const screen = render(MotionState);
		await frames();
		const toggle = screen
			.getByRole('button', { name: 'Toggle inherited variant' })
			.element() as HTMLButtonElement;
		const parent = visualElementStore.get(screen.getByTestId('motion-parent').element())!;
		const childVisual = visualElementStore.get(
			screen.getByTestId('motion-second-child').element()
		)!;
		const events: { label: string; parent: string; at: number }[] = [];
		childVisual.on('AnimationStart', (definition) =>
			events.push({
				label: String(definition),
				parent: String(parent.getProps().animate),
				at: performance.now()
			})
		);
		for (let i = 0; i < 7; i++) {
			flushSync(() => toggle.click());
			await frames();
		}
		const child = screen.getByTestId('motion-second-child').element() as HTMLElement;
		await expect.poll(() => new DOMMatrix(getComputedStyle(child).transform).e).toBeCloseTo(50, 3);
		for (let i = 0; i < 25; i++) await frame();
		expect(new DOMMatrix(getComputedStyle(child).transform).e, JSON.stringify(events)).toBeCloseTo(
			50,
			3
		);
	}
);

it('reconciles gesture availability, disable and re-entry through the real binding', async () => {
	const screen = render(MotionState);
	await frames();
	const node = screen.getByTestId('motion-gesture').element() as HTMLElement;
	const enter = (element = node) =>
		element.dispatchEvent(
			new PointerEvent('pointerenter', { pointerType: 'mouse', isPrimary: true })
		);
	const scale = (element = node) => {
		const visual = visualElementStore.get(element)!;
		return Number(visual.getValue('scale')?.get() ?? visual.latestValues.scale);
	};
	enter();
	await frames();
	expect(scale()).toBe(1);
	await screen.getByRole('button', { name: 'Toggle gesture availability' }).click();
	enter();
	await expect.poll(() => scale()).toBeCloseTo(1.2, 3);
	await screen.getByRole('button', { name: 'Toggle gesture disabled' }).click();
	await expect.poll(() => scale()).toBeCloseTo(1, 3);
	enter();
	await frames();
	expect(scale()).toBeCloseTo(1, 3);
	await screen.getByRole('button', { name: 'Toggle gesture disabled' }).click();
	enter();
	await expect.poll(() => scale()).toBeCloseTo(1.2, 3);
	await screen.getByRole('button', { name: 'Toggle gesture owner' }).click();
	await expect.poll(() => node.isConnected).toBe(false);
	await screen.getByRole('button', { name: 'Toggle gesture owner' }).click();
	const replacement = screen.getByTestId('motion-gesture').element() as HTMLElement;
	await expect.poll(() => Number(getComputedStyle(replacement).opacity)).toBeCloseTo(1, 3);
	enter(replacement);
	await expect.poll(() => scale(replacement)).toBeCloseTo(1.2, 3);
});

it('releases DOM rendering on destruction while preserving the external MotionValue', async () => {
	const screen = render(MotionState);
	await frames();
	const node = screen.getByTestId('motion-value').element() as HTMLElement;
	const value = screen.component.externalValue();
	const seen: number[] = [];
	const stop = value.on('change', (latest) => seen.push(latest));
	try {
		await screen.unmount();
		await frames();
		const style = node.style.cssText;
		value.set(91);
		await frames();
		expect(value.get()).toBe(91);
		expect(seen).toEqual([91]);
		expect(node.style.cssText).toBe(style);
	} finally {
		stop();
	}
});

it('accepts hover before introend and hands the incoming pose to Motion state without a stale reset', async () => {
	const screen = render(MotionState);
	const node = screen.getByTestId('incoming-gesture').element() as HTMLElement;
	let introEnded = false;
	node.addEventListener(
		'introend',
		() => {
			introEnded = true;
		},
		{ once: true }
	);
	await frames();
	const visual = visualElementStore.get(node)!;
	expect(introEnded).toBe(false);
	const before = Number(visual.getValue('scale')?.get() ?? visual.latestValues.scale);
	node.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse', isPrimary: true }));
	expect(visual.animationState!.getState().whileHover.isActive).toBe(true);
	expect(Number(visual.getValue('scale')!.get())).toBeCloseTo(before, 3);
	await expect
		.poll(() => Number(visual.getValue('scale')!.get()), { timeout: 2000 })
		.toBeCloseTo(1.2, 3);
	for (let i = 0; i < 5; i++) await frame();
	expect(Number(visual.getValue('scale')!.get())).toBeCloseTo(1.2, 3);
	expect(introEnded).toBe(true);
});
