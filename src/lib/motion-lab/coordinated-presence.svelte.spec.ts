import { afterEach, expect, it } from 'vitest';
import { mount, unmount, flushSync, tick } from 'svelte';
import Fixture from './CoordinatedPresence.svelte';
import InheritedInitialFalse from './InheritedInitialFalse.svelte';
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
	for (const clean of cleanup.splice(0)) await clean();
});
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
async function fixture(when: 'beforeChildren' | 'afterChildren' = 'afterChildren') {
	const target = document.createElement('div');
	document.body.append(target);
	const app = mount(Fixture, { target, props: { when } });
	cleanup.push(async () => {
		await unmount(app);
		target.remove();
	});
	await tick();
	await frame();
	await frame();
	const node = (name: string) => target.querySelector<HTMLElement>(`[data-coordinated="${name}"]`)!;
	return { app, target, node };
}
const opacity = (node: HTMLElement) => Number(getComputedStyle(node).opacity);

it('does not replay inherited initial=false keyframes during native introduction', async () => {
	const target = document.createElement('div');
	document.body.append(target);
	const app = mount(InheritedInitialFalse, { target, intro: true });
	cleanup.push(async () => {
		await unmount(app);
		target.remove();
	});
	await tick();
	const child = target.querySelector<HTMLElement>('[data-inherited]')!;
	const end = performance.now() + 450;
	let minimum = 1;
	while (performance.now() < end) {
		await frame();
		minimum = Math.min(minimum, opacity(child));
	}
	expect(minimum).toBe(1);
	expect(new DOMMatrix(getComputedStyle(child).transform).e).toBe(0);
});

it('waits for staggered real child exits before animating the parent', async () => {
	const { app, target, node } = await fixture();
	const parent = node('parent'),
		first = node('first'),
		second = node('second');
	flushSync(() => app.toggle());
	await expect.poll(() => opacity(first)).toBeLessThan(0.8);
	expect(opacity(parent)).toBeCloseTo(1, 2);
	expect(opacity(first)).toBeLessThan(opacity(second));
	await expect.poll(() => opacity(parent)).toBeLessThan(0.85);
	expect(opacity(first)).toBeCloseTo(0, 2);
	expect(opacity(second)).toBeCloseTo(0, 2);
	await expect.poll(() => target.children.length).toBe(0);
});

it('animates the parent first and retains its branch through the last child', async () => {
	const { app, target, node } = await fixture('beforeChildren');
	const parent = node('parent'),
		first = node('first');
	flushSync(() => app.toggle());
	await expect.poll(() => opacity(parent)).toBeLessThan(0.8);
	expect(opacity(first)).toBeCloseTo(1, 2);
	await expect.poll(() => opacity(first)).toBeLessThan(0.8);
	expect(opacity(parent)).toBeCloseTo(0.2, 2);
	expect(parent.isConnected).toBe(true);
	await expect.poll(() => target.children.length).toBe(0);
});

it('reverses a coordinated exit on the same DOM and cancels delayed stale targets', async () => {
	const { app, node } = await fixture();
	const parent = node('parent'),
		first = node('first');
	flushSync(() => app.toggle());
	await expect.poll(() => opacity(first)).toBeLessThan(0.8);
	flushSync(() => app.toggle());
	await expect.poll(() => opacity(first)).toBeCloseTo(1, 2);
	expect(node('parent')).toBe(parent);
	await new Promise((resolve) => setTimeout(resolve, 700));
	expect(opacity(first)).toBeCloseTo(1, 2);
	expect(opacity(parent)).toBeCloseTo(1, 2);
});

it('settles every retained trajectory on a live reduced-motion change', async () => {
	const { app, target, node } = await fixture();
	const first = node('first');
	flushSync(() => app.toggle());
	await expect.poll(() => opacity(first)).toBeLessThan(0.9);
	flushSync(() => app.reduce());
	await expect.poll(() => target.children.length).toBe(0);
});
