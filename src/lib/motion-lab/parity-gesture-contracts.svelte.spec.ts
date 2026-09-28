import { flushSync, tick } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { isDragActive } from 'motion-dom';
import Fixture from './parity-gesture-contracts-fixture.svelte';

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
async function frames() {
	await frame();
	await frame();
}
const node = <T extends Element = HTMLElement>(name: string) =>
	document.querySelector<T>(`[data-contract-${name}]`)!;
function pointer(target: EventTarget, type: string, x: number, y: number, pointerId = 1) {
	const event = new PointerEvent(type, {
		bubbles: true,
		isPrimary: true,
		pointerType: 'mouse',
		button: 0,
		pointerId,
		clientX: x,
		clientY: y
	});
	target.dispatchEvent(event);
	return event;
}
const listeners: AbortController[] = [];
afterEach(() => {
	for (const controller of listeners.splice(0)) controller.abort();
	vi.restoreAllMocks();
});

it('routes global taps from outside the node, defers current callbacks and removes window listeners', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'tap', report });
	await tick();
	const outside = node('outside');
	pointer(outside, 'pointerdown', 70, 35);
	expect(report).not.toHaveBeenCalled();
	flushSync(() => view.component.configureTap(true, 'updated'));
	await expect.poll(() => report.mock.calls.map(([name]) => name)).toEqual(['updated:start']);
	pointer(outside, 'pointerup', 130, 55);
	expect(report).toHaveBeenCalledTimes(1);
	await expect
		.poll(() => report.mock.calls.map(([name]) => name))
		.toEqual(['updated:start', 'updated:tap']);
	expect(report.mock.calls[1][1]).toEqual({ point: { x: 130 + scrollX, y: 55 + scrollY } });

	flushSync(() => view.component.configureTap(false));
	await frames();
	pointer(outside, 'pointerdown', 70, 35);
	pointer(outside, 'pointerup', 70, 35);
	await frames();
	expect(report).toHaveBeenCalledTimes(2);
	pointer(node('tap'), 'pointerdown', 12, 12);
	pointer(node('tap'), 'pointerup', 12, 12);
	await expect.poll(() => report).toHaveBeenCalledTimes(4);

	flushSync(() => view.component.configureTap(true));
	await frames();
	report.mockClear();
	pointer(outside, 'pointerdown', 70, 35);
	await view.unmount();
	pointer(window, 'pointerup', 70, 35);
	pointer(window, 'pointerdown', 80, 35);
	pointer(window, 'pointerup', 80, 35);
	await frames();
	expect(report).not.toHaveBeenCalled();
});

for (const scenario of [
	{ name: 'arbitrates the same axis by default', propagate: false, outerAxis: 'x' as const },
	{
		name: 'allows the parent axis when propagation is enabled',
		propagate: true,
		outerAxis: 'x' as const
	},
	{
		name: 'allows independent nested axes without propagation',
		propagate: false,
		outerAxis: 'y' as const
	}
]) {
	it(`nested drag ${scenario.name} and releases both sessions`, async () => {
		const report = vi.fn();
		const view = render(Fixture, { mode: 'nested', ...scenario, report });
		await frames();
		pointer(node('inner'), 'pointerdown', 10, 10);
		pointer(window, 'pointermove', 50, 40);
		await frames();
		const parentStarts = scenario.propagate || scenario.outerAxis === 'y';
		expect(view.component.inspect()).toEqual({
			x: 40,
			y: 0,
			outerX: parentStarts && scenario.outerAxis === 'x' ? 40 : 0,
			outerY: scenario.outerAxis === 'y' ? 30 : 0
		});
		expect(report.mock.calls.map(([name]) => name)).toEqual(
			parentStarts ? ['inner:start', 'outer:start'] : ['inner:start']
		);
		pointer(window, 'pointerup', 50, 40);
		expect(report.mock.calls.some(([name]) => name.endsWith(':end'))).toBe(false);
		await frames();
		expect(report.mock.calls.map(([name]) => name)).toEqual(
			parentStarts
				? ['inner:start', 'outer:start', 'inner:end', 'outer:end']
				: ['inner:start', 'inner:end']
		);
		expect(isDragActive()).toBe(false);
		const settled = view.component.inspect();
		await view.unmount();
		pointer(window, 'pointermove', 200, 200);
		await frames();
		expect(view.component.inspect()).toEqual(settled);
		expect(isDragActive()).toBe(false);
	});
}

for (const replaceBounds of [true, false]) {
	it(`uses ${replaceBounds ? 'returned' : 'original'} measured drag bounds and renders before onDrag`, async () => {
		const report = vi.fn();
		const view = render(Fixture, { mode: 'measure', replaceBounds, report });
		await frames();
		const measured = node('measured');
		pointer(measured, 'pointerdown', 60, 60);
		pointer(window, 'pointermove', 360, 160);
		await frames();
		expect(report.mock.calls.find(([name]) => name === 'measure')?.[1]).toEqual({
			left: 0,
			right: 200,
			top: 0,
			bottom: 60
		});
		const expected = { x: replaceBounds ? 35 : 200, y: replaceBounds ? 0 : 60 };
		expect(report.mock.calls.filter(([name]) => name === 'move').at(-1)?.[1]).toEqual(expected);
		const transform = new DOMMatrix(getComputedStyle(measured).transform);
		expect(transform.m41).toBe(expected.x);
		expect(transform.m42).toBe(expected.y);
		pointer(window, 'pointermove', -100, -100);
		await frames();
		expect(view.component.inspect().x).toBe(replaceBounds ? -20 : 0);
		expect(view.component.inspect().y).toBe(0);
		await view.unmount();
		const calls = report.mock.calls.length;
		pointer(window, 'pointerup', -100, -100);
		await frames();
		expect(report).toHaveBeenCalledTimes(calls);
		expect(isDragActive()).toBe(false);
	});
}

it('snaps both axes from the live resized box before the drag threshold and stops with one deferred end', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'snap', report });
	await frames();
	flushSync(() => view.component.resizeSnap(120));
	await frames();
	const target = node('snap');
	const before = target.getBoundingClientRect();
	expect(before.width).toBe(120);
	const start = { x: before.left + before.width / 2 + 80, y: before.top + before.height / 2 + 30 };
	view.component.startSnap(pointer(node('handle'), 'pointerdown', start.x, start.y));
	expect(view.component.inspect()).toEqual({ x: 80, y: 30, outerX: 0, outerY: 0 });
	const snapped = target.getBoundingClientRect();
	expect(snapped.left + snapped.width / 2).toBe(start.x);
	expect(snapped.top + snapped.height / 2).toBe(start.y);
	expect(report).not.toHaveBeenCalled();
	pointer(window, 'pointermove', start.x + 6, start.y);
	await frames();
	expect(report).not.toHaveBeenCalled();
	expect(view.component.inspect().x).toBe(80);
	pointer(window, 'pointermove', start.x + 12, start.y);
	await frames();
	expect(view.component.inspect().x).toBe(92);
	expect(report.mock.calls.map(([name]) => name)).toEqual(['start']);
	view.component.stopDrag();
	expect(report).toHaveBeenCalledTimes(1);
	await expect.poll(() => report.mock.calls.map(([name]) => name)).toEqual(['start', 'end']);
	pointer(window, 'pointerup', start.x + 12, start.y);
	await frames();
	expect(report).toHaveBeenCalledTimes(2);
	expect(isDragActive()).toBe(false);
	await view.unmount();
});

it('keeps a once viewport active after exit and resumes observation when once changes', async () => {
	const report = vi.fn();
	const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
	const view = render(Fixture, { mode: 'viewport', once: true, report });
	await expect.poll(() => report.mock.calls.map(([name]) => name)).toEqual(['enter']);
	const target = node('viewport');
	const root = node('first-root');
	expect(report.mock.calls[0][1]).toBeInstanceOf(IntersectionObserverEntry);
	await expect.poll(() => getComputedStyle(target).opacity).toBe('1');
	expect(disconnect).toHaveBeenCalled();
	root.scrollTop = 200;
	await frames();
	expect(getComputedStyle(target).opacity).toBe('1');
	expect(report).toHaveBeenCalledTimes(1);
	flushSync(() => view.component.configureViewport(false, false));
	await expect.poll(() => getComputedStyle(target).opacity).toBe('0.25');
	root.scrollTop = 0;
	await expect.poll(() => report.mock.calls.map(([name]) => name)).toEqual(['enter', 'enter']);
	root.scrollTop = 200;
	await expect
		.poll(() => report.mock.calls.map(([name]) => name))
		.toEqual(['enter', 'enter', 'leave']);
	await view.unmount();
	const calls = report.mock.calls.length;
	root.scrollTop = 0;
	await frames();
	expect(report).toHaveBeenCalledTimes(calls);
});

it('rebinds a getter viewport root without remounting the target and disconnects the old observer', async () => {
	const report = vi.fn();
	const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
	const view = render(Fixture, { mode: 'viewport', report });
	await expect.poll(() => report.mock.calls.map(([name]) => name)).toEqual(['enter']);
	const target = node('viewport');
	disconnect.mockClear();
	flushSync(() => view.component.configureViewport(true));
	await expect.poll(() => getComputedStyle(target).opacity).toBe('0.25');
	expect(disconnect).toHaveBeenCalledTimes(1);
	expect(node('viewport')).toBe(target);
	node('first-root').scrollTop = 200;
	node('second-root').scrollTop = 200;
	await frames();
	expect(report).toHaveBeenCalledTimes(1);
	node('first-root').scrollTop = 0;
	flushSync(() => view.component.configureViewport(false));
	await expect.poll(() => report.mock.calls.map(([name]) => name)).toEqual(['enter', 'enter']);
	await expect.poll(() => getComputedStyle(target).opacity).toBe('1');
	expect(node('viewport')).toBe(target);
	await view.unmount();
	expect(disconnect).toHaveBeenCalledTimes(3);
});

it('drags a rendered SVG rect with trusted pointer input through viewBox origin and letterboxing', async () => {
	const report = vi.fn();
	const view = render(Fixture, { mode: 'svg', report });
	await frames();
	const svg = node<SVGSVGElement>('svg');
	const target = node<SVGRectElement>('svg-drag');
	const destination = node<SVGRectElement>('svg-destination');
	const sourceMatrix = target.getScreenCTM()!;
	const inverse = svg.getScreenCTM()!.inverse();
	let down: PointerEvent | undefined;
	let up: PointerEvent | undefined;
	const lifetime = new AbortController();
	listeners.push(lifetime);
	target.addEventListener(
		'pointerdown',
		(event) => {
			down = event;
		},
		{ signal: lifetime.signal }
	);
	window.addEventListener(
		'pointerup',
		(event) => {
			up = event;
		},
		{ signal: lifetime.signal, capture: true }
	);
	await userEvent.dragAndDrop(target, destination);
	await expect.poll(() => report.mock.calls.filter(([name]) => name === 'end').length).toBe(1);
	const events = report.mock.calls.map(([name]) => name);
	expect(events[0]).toBe('start');
	expect(events.at(-1)).toBe('end');
	expect(report.mock.calls.every(([, data]) => data.trusted)).toBe(true);
	expect(events).toContain('move');
	expect(down?.isTrusted).toBe(true);
	expect(up?.isTrusted).toBe(true);
	// Browser automation supplies fractional native coordinates. Compare the
	// exact delivered pointer movement, rather than an assumed box midpoint.
	const from = new DOMPoint(down!.clientX, down!.clientY).matrixTransform(inverse);
	const to = new DOMPoint(up!.clientX, up!.clientY).matrixTransform(inverse);
	expect(to.x - from.x).toBeGreaterThan(50);
	expect(to.y - from.y).toBeGreaterThan(15);
	expect(view.component.inspect().x).toBeCloseTo(to.x - from.x, 5);
	expect(view.component.inspect().y).toBeCloseTo(to.y - from.y, 5);
	const rendered = target.getScreenCTM()!;
	expect(rendered.e - sourceMatrix.e).toBeCloseTo(up!.clientX - down!.clientX, 5);
	expect(rendered.f - sourceMatrix.f).toBeCloseTo(up!.clientY - down!.clientY, 5);
	expect(target.namespaceURI).toBe('http://www.w3.org/2000/svg');
	expect(isDragActive()).toBe(false);
	const final = view.component.inspect();
	await view.unmount();
	const calls = report.mock.calls.length;
	pointer(window, 'pointermove', 600, 600);
	await frames();
	expect(view.component.inspect()).toEqual(final);
	expect(report).toHaveBeenCalledTimes(calls);
});
