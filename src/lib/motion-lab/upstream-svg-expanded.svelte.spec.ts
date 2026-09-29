// Motion v13.4.4, commit 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Sources and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamSvgExpanded.svelte';
const node = (name: string) => document.querySelector<SVGElement>(`[data-case="${name}"]`)!;
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++)
		await new Promise<void>((done) => requestAnimationFrame(() => done()));
};
const matrix = (name: string) => new DOMMatrix(getComputedStyle(node(name)).transform);

it('svg-initial-derived: applies derived drawing, paint and centered transform styles at mount', () => {
	render(Fixture);
	const path = node('derived');
	expect(path.getAttribute('pathLength')).toBe('1');
	expect(path.getAttribute('stroke-dasharray')).toBe('0.5 1');
	expect(Number(path.getAttribute('stroke-dashoffset'))).toBe(0);
	expect(getComputedStyle(path).opacity).toBe('0.5');
	expect(getComputedStyle(node('fill')).fill).toBe('rgb(180, 180, 180)');
	expect([matrix('derived').m41, matrix('derived').m42]).toEqual([10, 10]);
	for (const name of ['derived', 'static']) {
		expect(node(name).style.transformBox).toBe('fill-box');
		expect(node(name).style.transformOrigin).toMatch(/^50% 50%( 0px)?$/);
		expect(node(name).style.transform).not.toContain('translateZ');
	}
	expect(node('static').style.transform).toBe('rotate(45deg)');
});

it('svg-transform-only: animates and retargets without animated SVG attributes', async () => {
	const screen = render(Fixture, { mode: 'transform' });
	await expect.poll(() => matrix('transform').a).toBeCloseTo(Math.SQRT1_2, 3);
	screen.component.change();
	await expect.poll(() => matrix('transform').a).toBeCloseTo(0, 3);
	expect(matrix('transform').b).toBeCloseTo(1, 3);
	expect(node('transform').getAttribute('width')).toBe('100');
});

it('svg-transform-geometry: translates, rotates and scales about the SVG fill box', () => {
	render(Fixture, { mode: 'geometry' });
	const root = node('svg').getBoundingClientRect();
	const expected = {
		rotate: [50 - Math.SQRT2 * 50, 50 - Math.SQRT2 * 50, Math.SQRT2 * 100, Math.SQRT2 * 100],
		scale: [-50, 150, 200, 200],
		translate: [150, 350, 100, 100]
	};
	for (const [name, coordinates] of Object.entries(expected)) {
		const rect = node(name).getBoundingClientRect();
		[rect.left - root.left, rect.top - root.top, rect.width, rect.height].forEach((value, index) =>
			expect(Math.abs(value - coordinates[index])).toBeLessThan(0.5)
		);
	}
});

it('svg-css-variable: resolves changed fill targets from CSS variables', async () => {
	const screen = render(Fixture, { mode: 'css-var' });
	expect(getComputedStyle(node('paint')).fill).toBe('rgb(0, 0, 0)');
	screen.component.change();
	await expect.poll(() => getComputedStyle(node('paint')).fill).toBe('rgb(180, 0, 180)');
	expect(node('paint').getAttribute('fill')?.replace(/\s/g, '')).toMatch(
		/^(?:rgba?\(180,0,180(?:,1)?\)|var\(--paint\))$/
	);
});

it('svg-origins: composes default origins, single-axis overrides and skew', async () => {
	render(Fixture, { mode: 'origin' });
	await expect.poll(() => node('origin-xy').style.transform).toContain('skewX(45deg)');
	expect(node('default-origin').style.transformBox).toBe('fill-box');
	expect(node('default-origin').style.transformOrigin).toMatch(/^50% 50%( 0px)?$/);
	expect(node('origin-only').style.transform).toBe('');
	expect(node('origin-only').style.transformBox).toBe('');
	for (const name of ['origin-only', 'origin-x'])
		expect(node(name).style.transformOrigin).toMatch(/^100% 50%( 0px)?$/);
	expect(node('origin-x').style.transform).toContain('rotate(180deg)');
	expect(node('origin-xy').style.transformOrigin).toMatch(/^100% 100%( 0px)?$/);
	expect(node('origin-xy').style.transformBox).toBe('fill-box');
	expect(node('origin-y').style.transformOrigin).toMatch(/^50% 100%( 0px)?$/);
	expect(node('origin-y').style.transformBox).toBe('fill-box');
	// R(180deg) * skewX(45deg), around (50,100), maps (x,y) to (200-x-y,200-y).
	// A 100px square therefore occupies [0,100] through [200,200] in SVG coordinates.
	const root = node('svg').getBoundingClientRect();
	const yOnly = node('origin-y').getBoundingClientRect();
	[yOnly.left - root.left, yOnly.top - root.top, yOnly.width, yOnly.height].forEach(
		(value, index) => expect(Math.abs(value - [0, 100, 200, 100][index])).toBeLessThan(0.5)
	);
});

it('svg-attribute-aliases: updates geometry aliases independently of CSS transforms', async () => {
	const screen = render(Fixture, { mode: 'aliases' });
	const attrs = (name = 'aliases') =>
		['x', 'y', 'scale'].map((key) => node(name).getAttribute(key));
	expect(attrs()).toEqual(['10', '20', '2']);
	expect(node('aliases').style.transform).toBe('translateX(5px) scale(1.5)');
	await expect.poll(() => attrs('animated-aliases')).toEqual(['80', '90', '4']);
	screen.component.change();
	await expect.poll(() => attrs()).toEqual(['30', '40', '3']);
	expect(node('aliases').style.transform).toBe('translateX(5px) scale(1.5)');
	await frames();
	expect(attrs('animated-aliases')).toEqual(['80', '90', '4']);
	screen.component.removeAliases();
	await expect.poll(() => attrs()).toEqual([null, null, null]);
	await frames();
	expect(attrs()).toEqual([null, null, null]);
	expect(attrs('animated-aliases')).toEqual(['80', '90', '4']);
	for (const name of ['aliases', 'animated-aliases'])
		expect(node(name).style.transform).toBe('translateX(5px) scale(1.5)');
});

it('svg-derived-attribute-animation: animated borrowed radius updates the derived paint', async () => {
	const screen = render(Fixture, { mode: 'radius' });
	const { radius, radiusFill } = screen.component.values();
	expect(radius.get()).toBe(40);
	expect(getComputedStyle(node('radius')).fill).toBe('rgb(0, 0, 255)');
	screen.component.change();
	await expect.poll(() => radius.get()).toBe(100);
	await expect.poll(() => node('radius').getAttribute('r')).toBe('100');
	await expect.poll(() => getComputedStyle(node('radius')).fill).toBe('rgb(255, 0, 0)');
	expect(radiusFill.get()).toMatch(/255, 0, 0/);
});

it('svg-root-origin: rotating the root does not inject child-element zero origin', async () => {
	render(Fixture, { mode: 'root' });
	await expect.poll(() => matrix('root').a).toBeCloseTo(Math.cos((100 * Math.PI) / 180), 3);
	expect(node('root').style.transformOrigin).not.toMatch(/^0px 0px/);
});

it('svg-new-attributes: animates previously unseen dash attributes under a rotating SVG', async () => {
	render(Fixture, { mode: 'new-attributes' });
	await expect
		.poll(() => parseFloat(node('dash').getAttribute('stroke-dashoffset') ?? 'NaN'))
		.toBe(-125);
	expect(node('dash').getAttribute('stroke-dasharray')?.replace(/\s/g, '')).toBe('100px,200px');
	await expect
		.poll(() => new DOMMatrix(getComputedStyle(node('dash').parentElement!).transform).a)
		.toBeCloseTo(Math.cos((100 * Math.PI) / 180), 3);
});

it('svg-viewbox-delay: preserves the authored viewBox during delay then reaches target', async () => {
	const screen = render(Fixture, { mode: 'viewbox' });
	await tick();
	expect(node('viewbox').getAttribute('viewBox')).toBe('0 0 100 100');
	screen.component.change();
	await tick();
	await frames(2);
	expect(node('viewbox').getAttribute('viewBox')).toBe('0 0 100 100');
	await expect.poll(() => node('viewbox').getAttribute('viewBox')).toBe('100 100 200 200');
});

it('svg-transform-value: renders and updates a group transform MotionValue', async () => {
	const screen = render(Fixture, { mode: 'raw' });
	expect(node('raw').getAttribute('transform')).not.toBe('[object Object]');
	expect([matrix('raw').m41, matrix('raw').m42]).toEqual([10, 20]);
	screen.component.values().rawTransform.set('translate(30px, 40px)');
	await expect.poll(() => [matrix('raw').m41, matrix('raw').m42]).toEqual([30, 40]);
});

it('svg-css-motion-path: renders all motion-path properties as styles', () => {
	render(Fixture, { mode: 'path' });
	const target = node('path');
	expect(target.style.offsetPath).toContain('M 0 0 L 100 100');
	expect(target.style.offsetDistance).toBe('25%');
	expect(target.style.offsetRotate).toBe('auto');
	expect(target.style.offsetAnchor.split(/\s+/).every((value) => value === 'center')).toBe(true);
	expect(target.style.offsetAnchor).not.toBe('');
	for (const name of ['offsetPath', 'offsetDistance', 'offsetRotate', 'offsetAnchor'])
		expect(target.hasAttribute(name)).toBe(false);
});

it('svg-motionvalue-text: replaces text subscriptions without wrappers or namespace changes', async () => {
	const screen = render(Fixture, { mode: 'text' });
	const target = node('text');
	const { text, otherText } = screen.component.values();
	expect(target.textContent).toBe('10');
	expect(target.children.length).toBe(0);
	expect(target.namespaceURI).toBe('http://www.w3.org/2000/svg');
	text.set(20);
	await expect.poll(() => target.textContent).toBe('20');
	screen.component.replaceText();
	await expect.poll(() => target.textContent).toBe('30');
	text.set(99);
	await tick();
	await frames();
	expect(target.textContent).toBe('30');
	otherText.set(40);
	await expect.poll(() => target.textContent).toBe('40');
	expect(node('text')).toBe(target);
});

it('factory-svg-viewbox: custom SVG factory animates the SVG-specific attribute', async () => {
	const screen = render(Fixture, { mode: 'factory' });
	expect(node('viewbox').namespaceURI).toBe('http://www.w3.org/2000/svg');
	expect(node('viewbox').getAttribute('viewBox')).toBe('0 0 100 100');
	screen.component.change();
	await expect.poll(() => node('viewbox').getAttribute('viewBox')).toBe('100 100 200 200');
});
