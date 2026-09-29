// Adapted from Motion v13.4.4; sources and MIT notice: tests/motion-baseline/README.md, LICENSE.motion.
import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamPresenceVariants.svelte';

const node = (name: string) => document.querySelector<HTMLElement>(`[data-upstream="${name}"]`)!;
const x = (name: string) => new DOMMatrix(getComputedStyle(node(name)).transform).m41;
const frames = async () => {
	for (let i = 0; i < 3; i++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

it('an explicit child animate label overrides inherited parent variants', async () => {
	const { component } = render(Fixture, { scenario: 'variants' });
	await expect.poll(() => x('inherited')).toBe(-100);
	flushSync(() => component.show());
	await expect.poll(() => [x('parent'), x('inherited')]).toEqual([100, 100]);
	expect(x('override')).toBe(-100);
});

it('a late child enters from the inherited initial variant through an unlabelled wrapper', async () => {
	const { component } = render(Fixture, { scenario: 'variants' });
	flushSync(() => component.show());
	await expect.poll(() => x('parent')).toBe(100);
	flushSync(() => component.addChild());
	expect(x('late')).toBe(-100);
	await expect.poll(() => x('late')).toBe(100);
});

it('a deferred transitionEnd cannot overwrite the next instant variant', async () => {
	const { component } = render(Fixture, { scenario: 'race' });
	await frames();
	flushSync(() => component.selectVariant('visible'));
	await expect.poll(() => node('race').style.display).toBe('flex');
	flushSync(() => component.selectVariant('hidden'));
	await expect.poll(() => node('race').style.display).toBe('none');
	// Both updates flush before a frame can apply the first transitionEnd.
	flushSync(() => component.selectVariant('visible'));
	flushSync(() => component.selectVariant('hidden'));
	await frames();
	expect(node('race').style.display).toBe('none');
	expect(Number(getComputedStyle(node('race')).opacity)).toBe(0.5);
});

it('initial=false restores the first keyed child after repeated re-entry before exit settles', async () => {
	const { component } = render(Fixture, { scenario: 'rapid' });
	await tick();
	const bar = node('bar');
	expect(bar.style.opacity).toBe('1');
	for (let repeat = 0; repeat < 2; repeat++) {
		flushSync(() => component.selectMode('panel'));
		flushSync(() => component.selectMode('bar'));
		await frames();
		expect(node('bar')).toBe(bar);
		expect(bar.style.opacity).toBe('1');
		expect(new DOMMatrix(getComputedStyle(bar).transform).a).toBe(1);
	}
	await expect.poll(() => node('panel')).toBeNull();
});

it('a completed fast exit re-enters while a slow sibling still retains their presence group', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { scenario: 'group', onExitComplete: complete });
	await tick();
	const fast = node('fast');
	const group = node('group');
	expect(fast.style.opacity).toBe('1');
	flushSync(() => component.setPresent(false));
	await expect.poll(() => Number(getComputedStyle(fast).opacity)).toBe(0);
	expect(node('group')).toBe(group);
	expect(Number(getComputedStyle(node('slow')).opacity)).toBeGreaterThan(0);
	expect(complete).not.toHaveBeenCalled();
	flushSync(() => component.setPresent(true));
	await expect.poll(() => Number(getComputedStyle(fast).opacity)).toBe(1);
	expect(node('fast')).toBe(fast);
	expect(node('group')).toBe(group);
	expect(complete).not.toHaveBeenCalled();
});
