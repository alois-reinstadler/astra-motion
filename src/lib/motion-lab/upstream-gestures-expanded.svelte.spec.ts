// Adapted from Motion 13.4.4 @ 33f6e72; source IDs and MIT notices: tests/motion-baseline.
import { tick } from 'svelte';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamGesturesExpanded.svelte';
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async () => {
	await tick();
	await frame();
	await frame();
};
const node = (id = 'target') => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const opacity = (id = 'target') => Number(getComputedStyle(node(id)).opacity);
// Synthetic pointer events do not move the browser's real mouse. Park it before
// mounting so a prior trusted click cannot hover a newly inserted test target.
beforeEach(async () => {
	const parking = document.createElement('div');
	parking.style.cssText =
		'position:fixed;left:200px;top:150px;width:20px;height:20px;z-index:2147483647;';
	document.body.append(parking);
	try {
		await userEvent.hover(parking, { timeout: 2000 });
	} finally {
		parking.remove();
	}
});
let activePointer: { x: number; pointerType: string } | undefined;
function pointer(target: EventTarget, type: string, x = 10, pointerType = 'mouse') {
	if (type === 'pointerdown' || (type === 'pointermove' && activePointer)) {
		activePointer = { x, pointerType };
	} else if (type === 'pointerup' || type === 'pointercancel') {
		activePointer = undefined;
	}
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId: 1,
			isPrimary: true,
			pointerType,
			button: 0,
			clientX: x,
			clientY: 10
		})
	);
}
afterEach(async () => {
	if (activePointer) {
		pointer(window, 'pointerup', activePointer.x, activePointer.pointerType);
		await frames();
	}
	vi.restoreAllMocks();
});

it.each([true, false, 'unsupported'] as const)(
	'gesture-focus-variants: focus-visible=%s activates only eligible focus and restores transitionEnd',
	async (visible) => {
		const view = render(Fixture, { mode: 'focus' });
		await frames();
		expect(opacity()).toBe(0.2);
		const matches = node().matches.bind(node());
		vi.spyOn(node(), 'matches').mockImplementation((selector) => {
			if (selector !== ':focus-visible') return matches(selector);
			if (visible === 'unsupported') throw new Error('unsupported selector');
			return visible;
		});
		node().focus();
		if (visible === false) {
			await frames();
			expect(opacity()).toBe(0.2);
		} else {
			await expect.poll(opacity).toBe(0.8);
			node().blur();
			await expect.poll(opacity).toBe(0.2);
		}
		await view.unmount();
	}
);
it('gesture-touch-hover: ignores touch callbacks and styles but accepts mouse', async () => {
	const report = vi.fn();
	render(Fixture, { report });
	await frames();
	pointer(node(), 'pointerenter', 10, 'touch');
	pointer(node(), 'pointerleave', 10, 'touch');
	await frames();
	expect(report).not.toHaveBeenCalled();
	expect(opacity()).toBe(0.2);
	pointer(node(), 'pointerenter');
	await expect.poll(opacity).toBe(0.8);
	pointer(node(), 'pointerleave');
	await expect.poll(opacity).toBe(0.2);
	expect(report.mock.calls.map(([name]) => name)).toEqual(['hover:start', 'hover:end']);
});
it('gesture-hover-restoration: restores the authored base after hover transitionEnd', async () => {
	render(Fixture);
	await frames();
	expect(opacity()).toBe(0.2);
	pointer(node(), 'pointerenter');
	await expect.poll(opacity).toBe(0.8);
	pointer(node(), 'pointerleave');
	await frames();
	expect(opacity()).toBe(0.2);
});
it('gesture-hover-children: named hover activates and restores descendant variants', async () => {
	render(Fixture);
	await frames();
	expect(opacity('child')).toBe(0.3);
	pointer(node(), 'pointerenter');
	await expect.poll(() => opacity('child')).toBe(0.7);
	pointer(node(), 'pointerleave');
	await expect.poll(() => opacity('child')).toBe(0.3);
});
it.each([
	{ drag: false, outside: true },
	{ drag: true, outside: true },
	{ drag: true, outside: false }
])(
	'gesture-hover-release: drag=$drag outside=$outside retains hover until release',
	async ({ drag, outside }) => {
		const view = render(Fixture);
		view.component.configure({ dragging: drag });
		await frames();
		pointer(node(), 'pointerenter');
		await expect.poll(opacity).toBe(0.8);
		pointer(node(), 'pointerdown');
		if (drag && !outside) {
			pointer(window, 'pointermove', 50);
			await frames();
		}
		if (outside) pointer(node(), 'pointerleave');
		await frames();
		expect(opacity()).toBe(0.8);
		pointer(outside ? node('outside') : node(), 'pointerup');
		await expect.poll(opacity).toBe(outside ? 0.2 : 0.8);
	}
);
it('gesture-property-priority: hover updates opacity while a prior tap owns scale', async () => {
	render(Fixture, { mode: 'priority' });
	await frames();
	pointer(node(), 'pointerdown');
	await expect.poll(() => new DOMMatrix(getComputedStyle(node()).transform).a).toBe(2);
	pointer(node(), 'pointerenter');
	await expect.poll(opacity).toBe(0.6);
	expect(new DOMMatrix(getComputedStyle(node()).transform).a).toBe(2);
});
it('gesture-disabled-native: disabled native button suppresses callbacks and feedback', async () => {
	const report = vi.fn();
	render(Fixture, { mode: 'disabled', report });
	await frames();
	expect((node() as HTMLButtonElement).disabled).toBe(true);
	pointer(node(), 'pointerdown');
	pointer(node(), 'pointerup');
	await frames();
	expect(report).not.toHaveBeenCalled();
	expect(opacity()).toBe(1);
});
it.each([true, false])(
	'gesture-keyboard-cancel: blur-before-keyup=%s restores feedback exactly once',
	async (cancel) => {
		const report = vi.fn();
		render(Fixture, { mode: 'tap', report });
		await frames();
		node().focus();
		node().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		await expect.poll(opacity).toBe(1);
		if (cancel) node().blur();
		node().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
		if (!cancel) node().blur();
		await expect.poll(opacity).toBe(0.2);
		await frames();
		expect(report.mock.calls.map(([name]) => name)).toEqual([
			'old:start',
			cancel ? 'old:cancel' : 'old:tap'
		]);
	}
);
it('gesture-live-tap-handlers: replacement and removal do not retain callbacks or duplicate taps', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'tap', report });
	await frames();
	for (const revision of ['first', 'second', 'third']) {
		view.component.configure({ revision });
		await frames();
		pointer(node(), 'pointerdown');
		pointer(node(), 'pointerup');
		await frames();
	}
	expect(report.mock.calls.map(([name]) => name)).toEqual([
		'first:start',
		'first:tap',
		'second:start',
		'second:tap',
		'third:start',
		'third:tap'
	]);
	view.component.configure({ enabled: false });
	await frames();
	pointer(node(), 'pointerdown');
	pointer(node('outside'), 'pointerup');
	await frames();
	pointer(node('child'), 'pointerdown');
	pointer(node('child'), 'pointerup');
	await frames();
	expect(report.mock.calls.map(([name]) => name)).toEqual([
		'first:start',
		'first:tap',
		'second:start',
		'second:tap',
		'third:start',
		'third:tap',
		'sibling:tap'
	]);
});
it.each([
	['child', 'child'],
	['child', 'target'],
	['target', 'child'],
	['target', 'outside']
])('gesture-tap-ancestry: press %s release %s', async (down, up) => {
	const report = vi.fn();
	render(Fixture, { mode: 'ancestry', report });
	await frames();
	pointer(node(down), 'pointerdown');
	pointer(node(up), 'pointerup');
	await frames();
	const calls = report.mock.calls.map(([name]) => name);
	if (up === 'outside') expect(calls).toEqual(['child:cancel']);
	else expect(calls.sort()).toEqual(['child:tap', 'grandparent:tap', 'parent:tap']);
});
it('gesture-tap-after-drag: threshold suppresses tap and later presses recover', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'ancestry', report });
	view.component.configure({ dragging: true });
	await frames();
	pointer(node(), 'pointerdown');
	pointer(window, 'pointermove', 11);
	pointer(node(), 'pointerup', 11);
	await frames();
	expect(report.mock.calls.map(([name]) => name)).toContain('child:tap');
	report.mockClear();
	pointer(node(), 'pointerdown');
	pointer(window, 'pointermove', 60);
	await frames();
	pointer(node(), 'pointerup', 60);
	await frames();
	expect(report.mock.calls.map(([name]) => name)).not.toContain('child:tap');
	expect(opacity()).toBe(0.6);
	report.mockClear();
	pointer(node(), 'pointerdown');
	pointer(node(), 'pointerup');
	await frames();
	expect(report.mock.calls.filter(([name]) => name === 'child:tap')).toHaveLength(1);
});
it('gesture-press-variants: inherited press restores child base and current parent animate', async () => {
	const view = render(Fixture, { mode: 'variants' });
	await frames();
	expect(opacity('child')).toBe(0.2);
	pointer(node('parent'), 'pointerdown');
	await expect.poll(() => opacity('child')).toBe(1);
	pointer(node('parent'), 'pointerup');
	await expect.poll(() => opacity('child')).toBe(0.2);
	// Upstream's own-child press case has parent animate, without parent whileTap.
	view.component.configure({ active: true });
	await expect.poll(opacity).toBe(0.9);
	pointer(node(), 'pointerdown');
	await expect.poll(opacity).toBe(0.5);
	pointer(node(), 'pointerup');
	await expect.poll(opacity).toBe(0.9);
});
it('gesture-press-variants: press callback updates inherited sibling animation state', async () => {
	render(Fixture, { mode: 'reactive-variants' });
	await frames();
	expect(opacity('child')).toBe(0.2);
	pointer(node(), 'pointerdown');
	await expect.poll(() => [opacity(), opacity('child')]).toEqual([0.9, 0.9]);
});
it('gesture-press-variants: changing animate during press restores current hover and animate values', async () => {
	const view = render(Fixture, { mode: 'state' });
	await frames();
	pointer(node(), 'pointerenter');
	await expect.poll(opacity).toBe(0.6);
	pointer(node(), 'pointerdown');
	await expect.poll(opacity).toBe(1);
	view.component.configure({ active: true });
	await frames();
	pointer(node(), 'pointerup');
	await expect.poll(opacity).toBe(0.8);
	pointer(node(), 'pointerleave');
	await expect.poll(opacity).toBe(0.4);
});
it('gesture-tap-isolation: child isolates two ancestors while preserving native bubbling', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'ancestry', report });
	view.component.configure({ isolated: true });
	await frames();
	const native = vi.fn();
	node('grandparent').addEventListener('pointerdown', native, { once: true });
	pointer(node(), 'pointerdown');
	await expect.poll(opacity).toBe(1);
	expect(opacity('parent')).toBe(0.5);
	expect(opacity('grandparent')).toBe(0.4);
	pointer(node(), 'pointerup');
	await frames();
	expect(report.mock.calls.map(([name]) => name)).toEqual(['child:tap']);
	expect(native).toHaveBeenCalledOnce();
});
it('gesture-pan-lifecycle: orders callbacks, refreshes closures and ignores subthreshold endings', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'pan', report });
	await frames();
	pointer(node(), 'pointerdown');
	pointer(window, 'pointermove', 11);
	pointer(window, 'pointerup', 11);
	await frames();
	expect(report).not.toHaveBeenCalled();
	pointer(node(), 'pointerdown');
	pointer(window, 'pointermove', 40);
	await frames();
	expect(report.mock.calls[0][0]).toBe('old:start');
	expect(report.mock.calls[1][0]).toBe('old:pan');
	view.component.configure({ revision: 'new' });
	await frames();
	pointer(window, 'pointermove', 70);
	await frames();
	pointer(window, 'pointerup', 70);
	await frames();
	expect(report.mock.calls.map(([name]) => name)).toContain('new:pan');
	expect(report.mock.calls.at(-1)?.[0]).toBe('new:end');
	expect(getComputedStyle(node()).transform).toBe('none');
});

it('gesture-hover-release: higher-priority tap remains through hover leave and restores base after outside release', async () => {
	render(Fixture, { mode: 'state' });
	await frames();
	pointer(node(), 'pointerenter');
	await expect.poll(opacity).toBe(0.6);
	pointer(node(), 'pointerdown');
	await expect.poll(opacity).toBe(1);
	pointer(node(), 'pointerleave');
	await frames();
	expect(opacity()).toBe(1);
	pointer(node('outside'), 'pointerup');
	await expect.poll(opacity).toBe(0.2);
});
