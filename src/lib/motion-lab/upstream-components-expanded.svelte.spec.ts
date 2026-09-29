// Motion v13.4.4, commit 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Source mapping and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync, tick } from 'svelte';
import { updateLayout } from '../motion/index.js';
import { visualElementStore } from 'motion-dom';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamComponentsExpanded.svelte';
const node = (name: string) => document.querySelector<HTMLElement>(`[data-case="${name}"]`)!;
const matrix = (name: string) => new DOMMatrix(getComputedStyle(node(name)).transform);
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((done) => requestAnimationFrame(() => done()));
};

it('initial-update-stability: changing initial after mount leaves the established pose', async () => {
	const screen = render(Fixture);
	await tick();
	expect(matrix('initial').m41).toBe(100);
	screen.component.configure({ initialX: 200 });
	await tick();
	await frames();
	expect(matrix('initial').m41).toBe(100);
});

it('factory-motion-props: forwarding is opt-in and both custom roots animate', async () => {
	render(Fixture, { mode: 'props' });
	expect(node('default').dataset.forwarded).toBe('filtered');
	expect(node('forward').dataset.forwarded).toBe('{"opacity":0.5}');
	expect(node('default').textContent?.trim()).toBe('Default');
	expect(node('forward').textContent?.trim()).toBe('Forward');
	for (const name of ['default', 'forward'])
		await expect.poll(() => node(name).style.opacity).toBe('0.5');
});

it('ref-ready-onmount: native and Motion refs are connected during onMount', async () => {
	const screen = render(Fixture, { mode: 'refs' });
	await tick();
	expect(screen.component.inspect().mounted).toEqual([node('native-ref'), node('motion-ref')]);
	expect(screen.component.inspect().mounted?.every((element) => element?.isConnected)).toBe(true);
});

it('object-initial-not-inherited: object targets apply only to their author', async () => {
	render(Fixture, { mode: 'object' });
	await tick();
	expect(node('parent').style.opacity).toBe('0.2');
	expect(matrix('parent').m42).toBe(50);
	expect(node('child').style.opacity).toBe('');
	expect(matrix('child').m42).toBe(0);
});

it('nested-layout-size-interrupt: reversal preserves the interpolated width', async () => {
	const screen = render(Fixture, { mode: 'layout' });
	await tick();
	await frames();
	const target = node('layout');
	expect(target.getBoundingClientRect().width).toBe(50);
	screen.component.configure({ expanded: true });
	await expect
		.poll(
			() => {
				const width = target.getBoundingClientRect().width;
				return width > 80 && width < 180;
			},
			{ interval: 10 }
		)
		.toBe(true);
	const playback = () =>
		[target.parentElement!, target].flatMap((element) => {
			const control = visualElementStore.get(element)?.projection?.currentAnimation;
			return control ? [control] : [];
		});
	const opening = playback();
	expect(opening.length).toBeGreaterThan(0);
	for (const control of opening) control.pause();
	await frames();
	const before = target.getBoundingClientRect().width;
	expect(before).toBeGreaterThan(80);
	expect(before).toBeLessThan(200);
	updateLayout(() => flushSync(() => screen.component.configure({ expanded: false })));
	// Projection rendering follows the public commit. Control its clock so this
	// compares the interruption origin, not movement during a later frame.
	await frames();
	const closing = playback();
	expect(closing.length).toBeGreaterThan(0);
	for (const control of closing) {
		control.pause();
		control.time = 0;
	}
	await frames();
	expect(Math.abs(target.getBoundingClientRect().width - before)).toBeLessThan(5);
	for (const control of closing) control.play();
	await expect.poll(() => target.getBoundingClientRect().width).toBeCloseTo(50, 1);
});

it('initial-variant-resolution: initial labels resolve child custom data and grandchildren', async () => {
	render(Fixture, { mode: 'variants' });
	expect(node('static-parent').style.opacity).toBe('0.25');
	expect(matrix('grandchild').m41).toBe(30);
	expect(matrix('custom-one').m41).toBe(10);
	expect(matrix('custom-two').m41).toBe(20);
});

it('style-value-replacement: swaps independent MotionValues and scalar styles bidirectionally', async () => {
	const screen = render(Fixture, { mode: 'style' });
	const { x, y, z, color } = screen.component.inspect();
	const position = () => {
		const m = matrix('style');
		return [m.m41, m.m42, m.m43];
	};
	expect(position()).toEqual([0, 2, 3]);
	expect(getComputedStyle(node('style')).backgroundColor).toBe('rgb(255, 255, 255)');
	screen.component.configure({ replace: true, scalarColor: true });
	await expect.poll(position).toEqual([1, 0, 0]);
	x.set(11);
	y.set(22);
	z.set(33);
	color.set('#f00');
	await expect.poll(position).toEqual([11, 0, 0]);
	expect(getComputedStyle(node('style')).backgroundColor).toBe('rgb(0, 0, 0)');
	screen.component.configure({ replace: false, scalarColor: false });
	await expect.poll(position).toEqual([0, 22, 33]);
	await expect.poll(() => getComputedStyle(node('style')).backgroundColor).toBe('rgb(255, 0, 0)');
	x.set(99);
	y.set(4);
	z.set(5);
	color.set('#00f');
	await expect.poll(position).toEqual([0, 4, 5]);
	await expect.poll(() => getComputedStyle(node('style')).backgroundColor).toBe('rgb(0, 0, 255)');
});

it.each([false, true])(
	'ssr-tap-focusability: client mount supplies only missing tabindex (explicit=%s)',
	async (explicitTabindex) => {
		render(Fixture, { mode: 'tap', explicitTabindex });
		for (const name of ['tap', 'tap-start', 'while-tap'])
			await expect.poll(() => node(name).tabIndex).toBe(explicitTabindex ? 2 : 0);
	}
);
