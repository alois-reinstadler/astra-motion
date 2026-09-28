import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import { domAnimation } from '../motion/dom-animation.js';
import { domMax } from '../motion/dom-max.js';
import type { FeatureBundle } from '../motion/lazy-context.js';
import Harness from './parity-lazy-harness.svelte';
import CompositionHarness from './parity-lazy-composition-harness.svelte';

function deferred() {
	let resolve!: (bundle: FeatureBundle) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<FeatureBundle>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { resolve, reject, load: vi.fn(() => promise) };
}
const frames = async (count = 3) => {
	for (let index = 0; index < count; index++) {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		await tick();
	}
};
const x = (element: Element) => new DOMMatrix(getComputedStyle(element).transform).e;

it('retains native inputs, refs and latest targets while deferred features load', async () => {
	const pending = deferred();
	const screen = render(Harness, { features: pending.load });
	await tick();
	const api = screen.component.getApi();
	const root = api.root!,
		input = api.input!;
	expect(visualElementStore.has(root)).toBe(false);
	expect(x(root)).toBe(0);
	input.value = 'typed before loading';
	input.dispatchEvent(new Event('input', { bubbles: true }));
	const button = root.querySelector('button')!;
	button.click();
	expect(api.clicked).toBe(1);
	button.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
	await frames();
	expect(api.hovered).toBe(0);
	screen.component.configure({ target: 120 });
	pending.resolve(domAnimation);
	await expect.poll(() => x(root)).toBeCloseTo(120, 2);
	expect(api.root).toBe(root);
	expect(api.input).toBe(input);
	expect(api.text).toBe('typed before loading');
	expect(input.value).toBe('typed before loading');
	expect(visualElementStore.has(root)).toBe(true);
	button.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
	await expect.poll(() => api.hovered).toBe(1);
	await expect
		.poll(() => getComputedStyle(root.querySelector('[data-testid="lazy-inherited"]')!).opacity)
		.toBe('0.75');
	await expect.poll(() => root.querySelector('circle')!.getAttribute('r')).toBe('10');
	const visual = visualElementStore.get(root)!;
	await screen.unmount();
	expect(visual.current).toBeNull();
	expect(visual.children.size).toBe(0);
	const restoredTransform = root.style.transform;
	visual.getValue('x')?.set(999);
	await frames();
	expect(root.style.transform).toBe(restoredTransform);
});

it('ignores replaced loaders and disposed pending elements', async () => {
	const older = deferred(),
		newer = deferred();
	const screen = render(Harness, { features: older.load });
	await tick();
	const root = screen.component.getApi().root!;
	screen.component.configure({ features: newer.load });
	await tick();
	older.resolve(domMax);
	await frames();
	expect(visualElementStore.has(root)).toBe(false);
	newer.resolve(domAnimation);
	await expect.poll(() => x(root)).toBeCloseTo(80, 2);
	const visual = visualElementStore.get(root)!;
	const third = deferred();
	screen.component.configure({ features: third.load, present: false });
	await tick();
	await screen.unmount();
	third.resolve(domMax);
	await frames();
	expect(visual.current).toBeNull();
});

it('adopts the latest pending target when initial=false without replacing its input', async () => {
	const pending = deferred();
	const screen = render(Harness, { features: pending.load, initialFalse: true });
	await tick();
	const api = screen.component.getApi();
	const root = api.root!;
	const input = api.input!;
	expect(x(root)).toBe(80);
	input.value = 'preserve the draft';
	input.dispatchEvent(new Event('input', { bubbles: true }));
	screen.component.configure({ target: 140 });
	await tick();
	pending.resolve(domAnimation);
	await expect.poll(() => x(root)).toBe(140);
	expect(api.root).toBe(root);
	expect(api.input).toBe(input);
	expect(input.value).toBe('preserve the draft');
	await expect.poll(() => visualElementStore.has(root)).toBe(true);
	const visual = visualElementStore.get(root)!;
	expect(visual.latestValues.x).toBe(140);
	expect(visual.getValue('x')?.isAnimating() ?? false).toBe(false);
	await screen.unmount();
});

it('reports failed loading through Svelte boundaries and allows a retry', async () => {
	const pending = deferred();
	const screen = render(Harness, { features: pending.load });
	await tick();
	pending.reject(new Error('Feature request failed'));
	await expect
		.element(screen.getByTestId('lazy-error'))
		.toHaveTextContent('Feature request failed');
	screen.component.configure({ features: domAnimation });
	screen.component.getApi().retry();
	await tick();
	await expect
		.poll(() => screen.component.getApi().root && x(screen.component.getApi().root!))
		.toBeCloseTo(80, 2);
	await screen.unmount();
});

it('defers runtime installation in hidden Activity and starts on reveal', async () => {
	const pending = deferred();
	const screen = render(Harness, { features: pending.load });
	await tick();
	const root = screen.component.getApi().root!;
	screen.component.configure({ active: false, target: 140 });
	await tick();
	pending.resolve(domAnimation);
	await frames();
	expect(visualElementStore.has(root)).toBe(false);
	screen.component.configure({ active: true });
	await expect.poll(() => x(root)).toBeCloseTo(140, 2);
	expect(screen.component.getApi().root).toBe(root);
	await screen.unmount();
});

it('upgrades the same binding to domMax without replacing DOM or VisualElement', async () => {
	const screen = render(Harness, { features: domAnimation });
	await tick();
	const root = screen.component.getApi().root!;
	await expect.poll(() => x(root)).toBeCloseTo(80, 2);
	const visual = visualElementStore.get(root);
	screen.component.configure({ features: domMax, drag: true, layout: true });
	await tick();
	await frames();
	expect(screen.component.getApi().root).toBe(root);
	expect(visualElementStore.get(root)).toBe(visual);
	expect(visual?.projection).toBeDefined();
	const draggable = root.querySelector('[data-testid="lazy-drag"]')!;
	draggable.dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerId: 1,
			pointerType: 'mouse',
			button: 0,
			clientX: 10,
			clientY: 10,
			bubbles: true
		})
	);
	window.dispatchEvent(
		new PointerEvent('pointermove', {
			pointerId: 1,
			pointerType: 'mouse',
			buttons: 1,
			clientX: 40,
			clientY: 10
		})
	);
	await frames();
	window.dispatchEvent(
		new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 40, clientY: 10 })
	);
	await expect.poll(() => x(draggable)).toBeCloseTo(30, 1);
	await screen.unmount();
});

it('explains missing drag features after an async basic bundle resolves', async () => {
	const pending = deferred();
	const screen = render(Harness, { features: pending.load });
	await tick();
	screen.component.configure({ drag: true });
	pending.resolve(domAnimation);
	await expect
		.element(screen.getByTestId('lazy-error'))
		.toHaveTextContent(/drag and pan require the domMax/);
	await screen.unmount();
});

it('supports custom Svelte and custom native elements before and after loading', async () => {
	const pending = deferred();
	const screen = render(CompositionHarness, { features: pending.load, mode: 'custom' });
	await tick();
	const api = screen.component.getApi();
	const button = api.ref! as HTMLButtonElement;
	button.click();
	expect(api.clicks).toBe(1);
	expect(getComputedStyle(button).opacity).toBe('0.2');
	pending.resolve(domAnimation);
	await expect.poll(() => getComputedStyle(button).opacity).toBe('1');
	expect(api.ref).toBe(button);
	await expect
		.poll(() => x(document.querySelector('[data-testid="lazy-element"]')!))
		.toBeCloseTo(20, 2);
	await screen.unmount();
	expect(api.ref).toBeNull();
});

it('enforces the documented development-only strict policy reactively', async () => {
	const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const screen = render(CompositionHarness, { features: domAnimation, mode: 'strict' });
		await tick();
		screen.component.configure({ strict: true, ignoreStrict: true });
		await tick();
		if (process.env.NODE_ENV === 'production') expect(warnings).not.toHaveBeenCalled();
		else
			expect(warnings).toHaveBeenCalledWith(expect.stringContaining('an eager motion component'));
		await expect.element(screen.getByTestId('eager-strict')).toBeInTheDocument();
		screen.component.configure({ ignoreStrict: false });
		if (process.env.NODE_ENV === 'production') {
			await tick();
			expect(document.querySelector('[data-testid="composition-error"]')).toBeNull();
		} else {
			await expect
				.element(screen.getByTestId('composition-error'))
				.toHaveTextContent('an eager motion component');
		}
		await screen.unmount();
	} finally {
		warnings.mockRestore();
	}
});

it('removes strict registrations when eager descendants unmount', async () => {
	const screen = render(CompositionHarness, { features: domAnimation, mode: 'strict' });
	await tick();
	screen.component.configure({ visible: false });
	await expect.element(screen.getByTestId('eager-strict')).not.toBeInTheDocument();
	screen.component.configure({ strict: true });
	await tick();
	expect(document.querySelector('[data-testid="composition-error"]')).toBeNull();
	await screen.unmount();
});

it('joins mixed eager and deferred components into the same variant tree', async () => {
	const pending = deferred();
	const screen = render(CompositionHarness, { features: pending.load });
	await tick();
	const lazyParent = document.querySelector('[data-testid="lazy-parent"]')!;
	const eagerChild = document.querySelector('[data-testid="eager-child"]')!;
	const eagerParent = document.querySelector('[data-testid="eager-parent"]')!;
	const lazyChild = document.querySelector('[data-testid="lazy-child"]')!;
	pending.resolve(domAnimation);
	await expect.poll(() => x(lazyChild)).toBeCloseTo(40, 2);
	await expect.poll(() => x(eagerChild)).toBeCloseTo(30, 2);
	expect(visualElementStore.get(lazyChild)?.parent).toBe(visualElementStore.get(eagerParent));
	expect(visualElementStore.get(eagerChild)?.parent).toBe(visualElementStore.get(lazyParent));
	screen.component.configure({ label: 'closed' });
	await expect.poll(() => x(lazyChild)).toBeCloseTo(0, 2);
	await expect.poll(() => x(eagerChild)).toBeCloseTo(0, 2);
	await screen.unmount();
});
