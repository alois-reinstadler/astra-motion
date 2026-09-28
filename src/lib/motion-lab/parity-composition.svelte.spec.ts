import { flushSync, hydrate, tick, unmount as unmountSvelte } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { JSAnimation, styleSubjectEffect, visualElementStore } from 'motion-dom';
import Activity from './ParityCompositionActivity.svelte';
import Controls from './ParityCompositionControls.svelte';
import Path from './ParityCompositionPath.svelte';
import PathHost from './ParityCompositionPathHost.svelte';
import Factory from './ParityCompositionFactory.svelte';
import { factoryHTML } from './parity-composition-ssr.js';

const node = (name: string) => document.querySelector<HTMLElement>(`[data-composition-${name}]`)!;
const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await frame();
};
const position = (element: Element) => {
	const matrix = new DOMMatrix(getComputedStyle(element).transform);
	return { x: matrix.m41, y: matrix.m42 };
};

it('suppresses only the first Activity subtree, animates late children and retains paused work and DOM state', async () => {
	const start = vi.fn();
	const { component } = render(Activity, { onStart: start });
	await frames();
	expect(position(node('first')).x).toBe(0);
	expect(start).not.toHaveBeenCalled();
	flushSync(() => component.introduce());
	expect(position(node('late')).x).toBe(-80);
	await expect.poll(() => position(node('late')).x).toBe(0);
	expect(start).toHaveBeenCalledWith({ x: 0 }, undefined, undefined);
	const input = document.querySelector<HTMLInputElement>('input')!;
	input.value = 'Preserved';
	flushSync(() => component.hide());
	await expect.poll(() => node('activity').dataset.astraActivity).toBe('hidden');
	const count = node('frames').textContent;
	await frames(5);
	expect(node('frames').textContent).toBe(count);
	flushSync(() => component.show());
	expect(document.querySelector('input')).toBe(input);
	expect(input.value).toBe('Preserved');
	await expect.poll(() => node('frames').textContent).not.toBe(count);
});

it('allows a late child introduced while hidden to enter on the first reveal', async () => {
	const { component } = render(Activity, { initialMode: 'hidden' });
	await frames();
	flushSync(() => component.introduce());
	await frames();
	expect(node('activity').dataset.astraActivity).toBe('hidden');
	expect(node('frames').textContent).toBe('0');
	flushSync(() => component.show());
	await expect.poll(() => position(node('late')).x).toBe(0);
	await expect.poll(() => Number(node('frames').textContent)).toBeGreaterThan(0);
});

it('mounts controls in an ancestor, orchestrates descendants and unsubscribes removed children', async () => {
	const start = vi.fn();
	const { component, unmount } = render(Controls, { ancestor: true, onStart: start });
	await expect.poll(() => position(node('controlled')).x).toBe(40);
	await expect.poll(() => node('controlled-child').style.opacity).toBe('1');
	expect(start).toHaveBeenCalledExactlyOnceWith('mounted', undefined, undefined);
	const controls = component.controls();
	flushSync(() => component.removeChild());
	await tick();
	await expect.poll(() => document.querySelector('[data-composition-controlled]')).toBeNull();
	start.mockClear();
	await controls.start('last');
	expect(start).not.toHaveBeenCalled();
	await unmount();
	expect(() => controls.start('last')).toThrow('mounted component');
});

it.each([
	{ ancestor: false, duration: 0.25 },
	{ ancestor: true, duration: 0.25 },
	{ ancestor: false, duration: 0 },
	{ ancestor: true, duration: 0 }
])(
	'holds commands issued to hidden Activity descendants ($ancestor, duration=$duration) until reveal',
	async ({ ancestor, duration }) => {
		const { component } = render(Controls, { ancestor });
		await frames();
		const controls = component.controls();
		flushSync(() => component.hide());
		await expect.poll(() => node('controls-host').dataset.astraActivity).toBe('hidden');
		const visual = visualElementStore.get(node('controlled'))!;
		const pausedX = visual.getValue('x')?.get();
		const previous = visual.getValue('x')?.animation;
		const complete = controls.start({ x: 120 }, { duration, ease: 'linear' });
		await frames(9);
		expect(visual.getValue('x')?.get()).toBe(pausedX);
		expect(visual.getValue('x')?.animation).toBe(previous);
		flushSync(() => component.show());
		await complete;
		await expect.poll(() => position(node('controlled')).x).toBe(120);
	}
);

it('orders rapid start/stop/replacement, cancels stale completion and passes dynamic variant state', async () => {
	const start = vi.fn();
	const complete = vi.fn();
	const resolve = vi.fn();
	const { component } = render(Controls, {
		onStart: start,
		onComplete: complete,
		onResolve: resolve
	});
	await frames();
	const controls = component.controls();
	void controls.start('first');
	controls.stop();
	await frames(5);
	expect(position(node('controlled')).x).toBe(0);
	expect(complete).not.toHaveBeenCalled();
	void controls.start('first');
	await expect.poll(() => position(node('controlled')).x).toBeGreaterThan(0);
	await controls.start('last');
	await frames();
	expect(position(node('controlled')).x).toBe(60);
	expect(complete).toHaveBeenCalledExactlyOnceWith('last', undefined, undefined);
	expect(node('controlled').style.opacity).toBe('1');
	await controls.start('resolved');
	await frames();
	expect(resolve).toHaveBeenCalledWith(
		7,
		expect.objectContaining({ x: 60 }),
		expect.objectContaining({ x: expect.any(Number) })
	);
	expect(position(node('controlled')).x).toBe(67);
	expect(start.mock.calls.slice(-3).map(([definition]) => definition)).toEqual([
		'first',
		'last',
		'resolved'
	]);
});

it('renders a direct arc midpoint from numeric MotionValues and reverses without stale path writes', async () => {
	const { component } = render(Path);
	await frames();
	flushSync(() => component.move());
	await expect
		.poll(() => {
			const point = component.position();
			return point.y - point.x / 2;
		})
		.toBeGreaterThan(20);
	const midway = component.position();
	const original = component.playbacks().x;
	expect(original).toBeDefined();
	expect(position(node('path')).x).toBeCloseTo(midway.x, 3);
	expect(position(node('path')).y).toBeCloseTo(midway.y, 3);
	flushSync(() => component.move({ x: 0, y: 0 }));
	await frames();
	expect(original?.state).not.toBe('running');
	await expect.poll(() => component.position()).toEqual({ x: 0, y: 0 });
	await new Promise<void>((done) => setTimeout(done, 450));
	expect(component.position()).toEqual({ x: 0, y: 0 });
	expect(position(node('path'))).toEqual({ x: 0, y: 0 });
});

it.each(['x', 'y'] as const)(
	'stops a shared direct path by stopping its %s value and tears down the driver',
	async (axis) => {
		const { component, unmount } = render(Path);
		await frames();
		flushSync(() => component.move());
		await expect.poll(() => component.position().x).toBeGreaterThan(10);
		const playback = component.playbacks().x;
		expect(playback).toBeDefined();
		expect(component.playbacks().y).toBe(playback);
		component.stopAxis(axis);
		const stopped = component.position();
		await frames(5);
		expect(component.position()).toEqual(stopped);
		flushSync(() => component.move({ x: 300, y: 150 }));
		await frames();
		const resumed = component.playbacks().x;
		await unmount();
		expect(resumed?.state).not.toBe('running');
	}
);

it('pauses a direct path in hidden Activity and resumes the shared playback once', async () => {
	const { component } = render(PathHost);
	await frames();
	flushSync(() => component.target().move());
	await expect.poll(() => component.target().position().x).toBeGreaterThan(10);
	const playback = component.target().playbacks().x!;
	const originalPlay: unknown = Reflect.get(playback, 'play');
	if (typeof originalPlay !== 'function') throw new Error('Expected engine path playback controls');
	const resumed = vi.fn(() => originalPlay.call(playback));
	Reflect.set(playback, 'play', resumed);
	flushSync(() => component.hide());
	await expect.poll(() => node('path-host').dataset.astraActivity).toBe('hidden');
	const held = component.target().position();
	expect(playback.state).toBe('paused');
	await frames(5);
	expect(component.target().position()).toEqual(held);
	flushSync(() => component.show());
	await expect.poll(() => component.target().position()).toEqual({ x: 200, y: 100 });
	expect(resumed).toHaveBeenCalledTimes(1);
});

it('honors inherited reduced motion for direct and hybrid arcs', async () => {
	const { component } = render(PathHost, { reduced: true });
	await frames();
	flushSync(() => component.target().move());
	await frames();
	expect(component.target().position()).toEqual({ x: 200, y: 100 });
	await component.target().hybrid();
	await frames();
	expect(position(node('hybrid'))).toEqual({ x: 200, y: 100 });
});

it('settles active direct and hybrid arcs when inherited reduced motion changes', async () => {
	const { component } = render(PathHost);
	await frames();
	flushSync(() => component.target().move());
	await expect.poll(() => component.target().position().x).toBeGreaterThan(10);
	const direct = component.target().playbacks().x!;
	if (!(direct instanceof JSAnimation)) throw new Error('Expected a synchronous engine path driver');
	const hybrid = component.target().hybrid();
	direct.pause();
	hybrid.pause();
	direct.time = 0.2;
	hybrid.time = 0.2;
	await frames();
	expect(component.target().position()).toEqual({ x: 75, y: 100 });
	expect(position(node('hybrid'))).toEqual({ x: 75, y: 100 });
	const finished = Promise.all([direct.finished, hybrid.finished]);
	const complete = vi.spyOn(direct, 'complete');
	flushSync(() => component.reduceMotion());
	await finished;
	await frames();
	expect(component.target().position()).toEqual({ x: 200, y: 100 });
	expect(position(node('hybrid'))).toEqual({ x: 200, y: 100 });
	expect(complete).toHaveBeenCalledTimes(1);
});

it('forwards factory void attributes, SVG namespaces, custom bindings and MotionValue child replacement', async () => {
	const { component, unmount } = render(Factory);
	await frames();
	const input = document.querySelector<HTMLInputElement>('[data-composition-input]')!;
	const circle = document.querySelector<SVGCircleElement>('[data-composition-circle]')!;
	const button = document.querySelector<HTMLButtonElement>('[data-composition-button]')!;
	expect(component.inspect()).toMatchObject({ input, circle, button, attached: button });
	expect(input.type).toBe('email');
	expect(input.required).toBe(true);
	expect(input.value).toBe('example@astra.test');
	expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
	expect(circle.cx.baseVal.value).toBe(25);
	expect(circle.r.baseVal.value).toBe(12);
	expect(button.textContent?.trim()).toBe('10');
	component.update(25);
	await expect.poll(() => button.textContent?.trim()).toBe('25');
	button.click();
	expect(component.inspect().count).toBe(1);
	flushSync(() => component.replaceChild());
	component.update(99);
	await expect.poll(() => button.textContent?.trim()).toBe('Replaced');
	await unmount();
	expect(component.inspect()).toMatchObject({
		input: null,
		circle: null,
		button: null,
		attached: undefined,
		detached: 1
	});
});

it('hydrates actual server-rendered native factories without replacing DOM, geometry or user input', async () => {
	const container = document.createElement('div');
	container.innerHTML = factoryHTML;
	document.body.append(container);
	const input = container.querySelector<HTMLInputElement>('input')!;
	const circle = container.querySelector<SVGCircleElement>('circle')!;
	const button = container.querySelector('button')!;
	input.value = 'typed-before-hydration@astra.test';
	const warn = vi.spyOn(console, 'warn');
	const component = hydrate(Factory, { target: container });
	try {
		await frames();
		expect(container.querySelector('input')).toBe(input);
		expect(container.querySelector('circle')).toBe(circle);
		expect(container.querySelector('button')).toBe(button);
		expect(input.value).toBe('typed-before-hydration@astra.test');
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.r.baseVal.value).toBe(12);
		expect(component.inspect()).toMatchObject({ input, circle, button });
		expect(warn.mock.calls.flat().join(' ')).not.toContain('hydration');
	} finally {
		await unmountSvelte(component);
		container.remove();
		warn.mockRestore();
	}
});

it.each([false, true])(
	'curves hybrid paths on HTML and existing motion elements (motion=%s)',
	async (motionElement) => {
		const { component } = render(Path);
		await frames();
		const playback = component.hybrid(motionElement);
		playback.pause();
		playback.time = 0.2;
		await frames();
		const element = node(motionElement ? 'hybrid-motion' : 'hybrid');
		const midpoint = position(element);
		expect(midpoint.x).toBeCloseTo(75, 2);
		expect(midpoint.y).toBeCloseTo(100, 2);
		playback.play();
		await playback;
		await frames();
		expect(position(element)).toEqual({ x: 200, y: 100 });
		await component.hybrid(motionElement, { x: 0, y: 0 });
		await frames();
		expect(position(element)).toEqual({ x: 0, y: 0 });
	}
);

it('owns hybrid paths on explicit DOM subjects outside the scope and stops them when the owner unmounts', async () => {
	const { component, unmount } = render(Path);
	const element = document.createElement('div');
	document.body.append(element);
	try {
		await frames();
		const playback = component.external(element);
		playback.pause();
		playback.time = 0.5;
		await frames();
		expect(position(element)).toEqual({ x: 75, y: 100 });
		const x = styleSubjectEffect.get(element, 'x')!;
		const y = styleSubjectEffect.get(element, 'y')!;
		expect(x.animation).toBe(y.animation);
		playback.play();
		await unmount();
		const stopped = { x: x.get(), y: y.get() };
		await frames(5);
		expect({ x: x.get(), y: y.get() }).toEqual(stopped);
		expect(playback.state).toBe('idle');
	} finally {
		await unmount();
		element.remove();
	}
});
