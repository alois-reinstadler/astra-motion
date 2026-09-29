// Motion v13.4.4, commit 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Sources and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { frame, cancelFrame } from 'motion-dom';
import Fixture from './UpstreamValuesExpanded.svelte';
const node = (name: string) => document.querySelector<HTMLElement>(`[data-case="${name}"]`)!;
const matrix = (name: string) => new DOMMatrix(getComputedStyle(node(name)).transform);
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((done) => requestAnimationFrame(() => done()));
};

it('template-source-replacement: direct template input follows the replacement source only', async () => {
	const screen = render(Fixture);
	const { first, second } = screen.component.values();
	expect(matrix('template').m41).toBe(1);
	screen.component.configure({ replacement: true });
	await expect.poll(() => matrix('template').m41).toBe(2);
	first.set(99);
	await tick();
	await frames();
	expect(matrix('template').m41).toBe(2);
	second.set(30);
	await expect.poll(() => matrix('template').m41).toBe(30);
});

it('spring-scalar-units: scalar string spring retains units through intermediate and final values', async () => {
	const screen = render(Fixture, { mode: 'scalar' });
	await tick();
	const { percent } = screen.component.values();
	expect(percent.get()).toBe('0%');
	percent.set('100%');
	await expect.poll(() => parseFloat(percent.get()), { interval: 10 }).toBeGreaterThan(0);
	expect(parseFloat(percent.get())).toBeLessThan(100);
	expect(percent.get()).toMatch(/%$/);
	await expect.poll(() => percent.get()).toBe('100%');
	expect(node('scalar').style.transform).toContain('100%');
});

it('spring-events: emits one start and completion and releases hooks on destruction', async () => {
	const screen = render(Fixture, { mode: 'spring' });
	await tick();
	const { source, spring, events } = screen.component.values();
	expect(events).toEqual([]);
	source.set(100);
	await expect.poll(() => events[0]).toBe('start');
	await expect.poll(() => spring.get()).toBe(100);
	await expect.poll(() => events).toEqual(['start', 'complete']);
	await screen.unmount();
	source.set(200);
	await frames();
	expect(events).toEqual(['start', 'complete']);
});

it('derived-same-frame: read/update changes reach the derived DOM transform in postRender', async () => {
	const screen = render(Fixture, { mode: 'sum' });
	await tick();
	await frames();
	const { x, y } = screen.component.values();
	expect([matrix('sum').m41, matrix('sum').m42, matrix('sum').m43]).toEqual([0, 0, 0]);
	let inspect!: () => void;
	const setY = () => y.set(2);
	const setX = () => {
		x.set(1);
		frame.update(setY);
	};
	try {
		const observed = await new Promise<number[]>((resolve) => {
			inspect = () => {
				const value = matrix('sum');
				resolve([value.m41, value.m42, value.m43]);
			};
			frame.read(setX);
			frame.postRender(inspect);
		});
		expect(observed).toEqual([1, 2, 3]);
	} finally {
		cancelFrame(setX);
		cancelFrame(setY);
		cancelFrame(inspect);
	}
});

it('derived-logical-css: numeric logical properties acquire pixels at mount and update', async () => {
	const screen = render(Fixture, { mode: 'logical' });
	const properties = [
		'paddingBlock',
		'paddingInline',
		'marginBlock',
		'inset',
		'insetBlock',
		'insetInline'
	] as const;
	for (const property of properties) expect(node('logical').style[property]).toBe('25px');
	screen.component.values().logicalSource.set(50);
	await expect
		.poll(() => properties.map((property) => node('logical').style[property]))
		.toEqual(properties.map(() => '50px'));
});

it('derived-output-map: mixed DOM outputs track input ranges and unclamped options without replacing values', async () => {
	const screen = render(Fixture, { mode: 'map' });
	const { progress, outputs } = screen.component.values();
	const originals = { ...outputs };
	expect(getComputedStyle(node('map')).backgroundColor).toBe('rgb(180, 0, 180)');
	expect(getComputedStyle(node('map')).filter).toBe('blur(5px)');
	expect(matrix('map').a).toBe(0.75);
	expect(getComputedStyle(node('map')).opacity).toBe('0.75');
	progress.set(0);
	await expect.poll(() => getComputedStyle(node('map')).filter).toBe('blur(10px)');
	expect(matrix('map').a).toBe(0.5);
	progress.set(50);
	screen.component.configure({ maximum: 50 });
	await expect.poll(() => outputs.opacity.get()).toBe(1);
	await expect.poll(() => getComputedStyle(node('map')).filter).toBe('blur(0px)');
	expect(getComputedStyle(node('map')).backgroundColor).toBe('rgb(0, 0, 255)');
	screen.component.configure({ maximum: 100, clamp: false });
	progress.set(150);
	await expect.poll(() => outputs.scale.get()).toBe(1.25);
	expect(outputs.opacity.get()).toBe(1.25);
	for (const key of Object.keys(originals) as (keyof typeof outputs)[])
		expect(screen.component.values().outputs[key]).toBe(originals[key]);
	await expect.poll(() => matrix('map').a).toBe(1.25);
});

it('frame-live-callback: subsequent frames read the changed increment once per frame', async () => {
	const screen = render(Fixture, { mode: 'frame' });
	const history = screen.component.values().frames;
	await expect.poll(() => history.length).toBeGreaterThanOrEqual(3);
	for (let index = 1; index < history.length; index++)
		expect(history[index].value - history[index - 1].value).toBe(1);
	screen.component.configure({ increment: 2 });
	await tick();
	const start = history.length;
	await expect.poll(() => history.length).toBeGreaterThanOrEqual(start + 3);
	for (let index = start; index < history.length; index++)
		expect(history[index].value - history[index - 1].value).toBe(2);
	expect(new Set(history.map((entry) => entry.time)).size).toBe(history.length);
	await screen.unmount();
	const length = history.length;
	await frames();
	expect(history).toHaveLength(length);
});
