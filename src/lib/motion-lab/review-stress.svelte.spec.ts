import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import Lab from '../../routes/motion-lab/+page.svelte';
import SharedPresenceSpike from './SharedPresenceSpike.svelte';
import { createLayout } from '../motion/layout.js';
import { beforeCommit } from '../motion/commit.js';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function node(id: string): HTMLElement {
	const element = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (!element) throw new Error(`Missing ${id}`);
	return element;
}
async function click(id: string) {
	node(id).click();
	await tick();
	await frame();
}
async function positioned(element: HTMLElement, value: string) {
	await expect
		.poll(() => getComputedStyle(element).position, { timeout: 1000, interval: 5 })
		.toBe(value);
	await tick();
}
async function count(value: number) {
	const select = node('count') as HTMLSelectElement;
	select.value = String(value);
	select.dispatchEvent(new Event('change', { bubbles: true }));
	await tick();
	await frame();
}
const distance = (a: DOMRect, b: DOMRect) => Math.hypot(a.x - b.x, a.y - b.y);
const cleanups: Array<() => void> = [];
afterEach(() => {
	window.scrollTo(0, 0);
	cleanups
		.splice(0)
		.reverse()
		.forEach((cleanup) => cleanup());
});

describe('independent adversarial layout and presence tests', () => {
	beforeAll(() => console.warn('Adversarial browser:', navigator.userAgent));
	it('reverses a popped grid exit on the retained node and restores final flow', async () => {
		await render(Lab);
		const original = node('tile-0');
		const start = original.getBoundingClientRect();
		const sibling = node('tile-1');
		const siblingStart = sibling.getBoundingClientRect();
		await click('remove-0');
		expect(node('tile-0')).toBe(original);
		await positioned(original, 'absolute');
		expect(distance(original.getBoundingClientRect(), start)).toBeLessThan(3);
		await wait(70);
		await click('reset');
		expect(node('tile-0')).toBe(original);
		await positioned(original, 'static');
		await wait(1000);
		expect(distance(original.getBoundingClientRect(), start)).toBeLessThan(1);
		expect(distance(sibling.getBoundingClientRect(), siblingStart)).toBeLessThan(1);
		expect(Number(getComputedStyle(original).opacity)).toBeCloseTo(1);
	});

	it('projects sibling reflow when the browser dispatches delayed outrostart', async () => {
		await render(Lab);
		const exiting = node('tile-0');
		const sibling = node('tile-1');
		let before: DOMRect | undefined;
		exiting.addEventListener(
			'outrostart',
			() => {
				before = sibling.getBoundingClientRect();
			},
			{ once: true, capture: true }
		);
		const started = new Promise<void>((resolve) =>
			exiting.addEventListener('outrostart', () => resolve(), { once: true })
		);
		node('remove-0').click();
		await started;
		await positioned(exiting, 'absolute');
		expect(before).toBeDefined();
		expect(sibling.offsetLeft).toBe(exiting.offsetLeft);
		const projection = visualElementStore.get(sibling)?.projection;
		expect(
			distance(sibling.getBoundingClientRect(), before!),
			JSON.stringify({
				transform: sibling.style.transform,
				active: !!projection?.currentAnimation,
				blocked: projection?.root?.isUpdateBlocked(),
				rootUpdating: projection?.root?.isUpdating,
				rootId: projection?.root?.animationId,
				layoutDirty: projection?.isLayoutDirty,
				layout: projection?.layout,
				target: projection?.target,
				snapshot: projection?.snapshot
			})
		).toBeLessThan(20);
		await wait(950);
	});

	it('preserves a paused intermediate projection when an exiting node leaves flow', async () => {
		await render(Lab);
		await click('reorder');
		const exiting = node('tile-3');
		const projection = visualElementStore.get(exiting)?.projection;
		await expect.poll(() => !!projection?.currentAnimation).toBe(true);
		const animation = projection!.currentAnimation!;
		animation.pause();
		animation.time = 0.075;
		await frame();
		await frame();
		const paused = exiting.getBoundingClientRect();
		const matrix = new DOMMatrix(getComputedStyle(exiting).transform);
		expect(Math.hypot(matrix.e, matrix.f)).toBeGreaterThan(5);
		await frame();
		expect(distance(paused, exiting.getBoundingClientRect())).toBeLessThan(0.1);
		const traces: string[] = [];
		const trace = (label: string) => {
			const active = projection?.currentAnimation;
			traces.push(
				JSON.stringify({
					label,
					wall: performance.now(),
					rect: exiting.getBoundingClientRect(),
					transform: exiting.style.transform,
					same: active === animation,
					animationTime: active?.time,
					speed: active?.speed,
					state: active && 'state' in active ? active.state : undefined,
					rootId: projection?.root?.animationId,
					dirty: projection?.isLayoutDirty,
					snapshot: projection?.snapshot,
					layout: projection?.layout,
					target: projection?.target,
					delta: projection?.targetDelta
				})
			);
		};
		trace('paused');
		cleanups.push(projection!.addEventListener('didUpdate', () => trace('didUpdate')));
		cleanups.push(
			projection!.addEventListener('projectionUpdate', () => trace('projectionUpdate'))
		);
		let before: DOMRect | undefined;
		let outgoing = false;
		let sample: (box: DOMRect) => void = () => {};
		const sampled = new Promise<DOMRect>((resolve) => {
			sample = resolve;
		});
		const capture = () => {
			if (!outgoing) return;
			before = exiting.getBoundingClientRect();
			trace('beforeCommit');
			// Drain the projection commit microtask without advancing the browser animation frame.
			queueMicrotask(() =>
				queueMicrotask(() => {
					// Automatic presence metadata can commit before the queued flow mutation.
					// Sample the transaction that actually removes the retained node from flow.
					if (getComputedStyle(exiting).position !== 'absolute') return;
					trace('sample');
					sample(exiting.getBoundingClientRect());
				})
			);
		};
		beforeCommit.add(capture);
		cleanups.push(() => beforeCommit.delete(capture));
		exiting.addEventListener(
			'outrostart',
			() => {
				outgoing = true;
				trace('outrostart');
			},
			{ once: true, capture: true }
		);
		const started = new Promise<void>((resolve) =>
			exiting.addEventListener('outrostart', () => resolve(), { once: true })
		);
		node('remove-3').click();
		await started;
		const after = await sampled;
		expect(before).toBeDefined();
		expect(distance(before!, after), traces.join('\n')).toBeLessThan(3);
		expect(distance(paused, after)).toBeLessThan(3);
		expect(Math.abs(before!.width - after.width)).toBeLessThan(3);
		expect(getComputedStyle(exiting).position).toBe('absolute');
		await wait(450);
		expect(exiting.isConnected).toBe(false);
	});

	it('maintains scroll-relative geometry while reordering 100 nodes in an overflow container', async () => {
		await render(Lab);
		await count(100);
		await wait(450);
		expect(document.querySelectorAll('.tile')).toHaveLength(100);
		const scroller = document.querySelector<HTMLElement>('.list-stage')!;
		scroller.scrollTop = 220;
		await click('reorder');
		await wait(75);
		const moving = node('tile-12');
		const before = moving.getBoundingClientRect();
		const oldScroll = scroller.scrollTop;
		scroller.scrollTop += 43;
		const after = moving.getBoundingClientRect();
		expect(after.y - before.y).toBeCloseTo(-(scroller.scrollTop - oldScroll), 0);
		await click('columns');
		await click('remove-12');
		await wait(1000);
		expect(document.querySelectorAll('.tile')).toHaveLength(99);
		const survivors = [...document.querySelectorAll<HTMLElement>('.tile')];
		const positions = survivors.map((element) => {
			const rect = element.getBoundingClientRect();
			expect(rect.width).toBeGreaterThan(0);
			return `${Math.round(rect.x)},${Math.round(rect.y)}`;
		});
		expect(new Set(positions).size).toBe(99);
	});

	it('keeps document scroll displacement separate from active projection', async () => {
		await render(Lab);
		await click('nested');
		await wait(60);
		const moving = node('nested-child');
		const before = moving.getBoundingClientRect();
		const oldScroll = window.scrollY;
		window.scrollBy(0, 89);
		const after = moving.getBoundingClientRect();
		expect(window.scrollY - oldScroll).toBeGreaterThan(0);
		expect(after.y - before.y).toBeCloseTo(-(window.scrollY - oldScroll), 0);
		await click('nested');
		await wait(900);
		expect(Number.isFinite(moving.getBoundingClientRect().y)).toBe(true);
	});

	it('disposes projected children when their parent is destroyed during animation', async () => {
		await render(Lab);
		await count(100);
		await click('reorder');
		const old = [...document.querySelectorAll<HTMLElement>('.tile')];
		const projections = old.map((element) => visualElementStore.get(element)?.projection);
		await click('destroy');
		await wait(500);
		expect(old.every((element) => !element.isConnected)).toBe(true);
		expect(projections.every((projection) => projection?.instance === undefined)).toBe(true);
		await click('destroy');
		await wait(500);
		expect(document.querySelectorAll('.tile')).toHaveLength(100);
	});

	it('compensates nested child scale throughout the parent size animation', async () => {
		await render(Lab);
		const child = node('nested-child');
		const width = child.getBoundingClientRect().width;
		await click('nested');
		const samples: number[] = [];
		for (let index = 0; index < 8; index++) {
			samples.push(child.getBoundingClientRect().width);
			await wait(24);
		}
		expect(Math.max(...samples.map((sample) => Math.abs(sample - width)))).toBeLessThan(3);
		await wait(700);
		expect(child.getBoundingClientRect().width).toBeCloseTo(width, 0);
	});

	it('shares a resized background and nested artwork/title from their own old visual boxes', async () => {
		await render(Lab);
		const selectors = ['.product', '.product .art', '.product h3'];
		const oldBoxes = selectors.map((selector) =>
			document.querySelector(selector)!.getBoundingClientRect()
		);
		node('shared').click();
		await tick();
		selectors.forEach((selector, index) => {
			const box = document.querySelector(selector)!.getBoundingClientRect();
			expect(distance(box, oldBoxes[index])).toBeLessThan(35);
		});
		await wait(90);
		await click('shared');
		await wait(1000);
		selectors.forEach((selector, index) => {
			const box = document.querySelector(selector)!.getBoundingClientRect();
			expect(distance(box, oldBoxes[index])).toBeLessThan(1);
			expect(Math.abs(box.width - oldBoxes[index].width)).toBeLessThan(1);
		});
	});

	it('coordinates shared source/destination while Svelte retains both nodes during outro', async () => {
		await render(SharedPresenceSpike);
		const source = document.querySelector<HTMLElement>('[data-shared-presence="card"]')!;
		const start = source.getBoundingClientRect();
		node('shared-presence-toggle').click();
		await tick();
		const destination = document.querySelector<HTMLElement>('[data-shared-presence="detail"]')!;
		expect(source.isConnected).toBe(true);
		expect(document.querySelectorAll('[data-shared-presence]')).toHaveLength(2);
		expect(distance(destination.getBoundingClientRect(), start)).toBeLessThan(20);
		// WebKit starts the native WAAPI effect asynchronously after Svelte's dummy animation.
		await expect
			.poll(() => Number(getComputedStyle(destination).opacity), { timeout: 250, interval: 16 })
			.toBeGreaterThan(0);
		await click('shared-presence-toggle');
		await wait(700);
		const survivor = document.querySelector<HTMLElement>('[data-shared-presence="card"]')!;
		expect(document.querySelectorAll('[data-shared-presence]')).toHaveLength(1);
		expect(distance(survivor.getBoundingClientRect(), start)).toBeLessThan(1);
		expect(Number(getComputedStyle(survivor).opacity)).toBeCloseTo(1);
	});

	it('restores authored CSS priority after a popLayout reversal', async () => {
		await render(Lab);
		const original = node('tile-0');
		original.style.setProperty('position', 'static', 'important');
		await click('remove-0');
		await click('reset');
		await positioned(original, 'static');
		expect(original.style.getPropertyValue('position')).toBe('static');
		expect(original.style.getPropertyPriority('position')).toBe('important');
	});

	it('isolates simultaneous shared identities by scope and cleans their stacks', async () => {
		const a = createLayout({ id: 'adversarial-a', reducedMotion: 'always' });
		const b = createLayout({ id: 'adversarial-b', reducedMotion: 'always' });
		const elements = Array.from({ length: 3 }, () => document.createElement('div'));
		const disposals: Array<() => void> = [];
		elements.forEach((element, index) => {
			element.style.cssText = 'width:100px;height:40px';
			document.body.append(element);
			cleanups.push(() => element.remove());
			const stop = (index === 2 ? b : a)({ id: 'shared' })(element);
			if (stop) disposals.push(stop);
		});
		cleanups.push(() => disposals.splice(0).forEach((stop) => stop()));
		await Promise.resolve();
		const projections = elements.map((element) => visualElementStore.get(element)?.projection);
		expect(projections[0]?.getStack() === projections[1]?.getStack()).toBe(true);
		expect(projections[1]?.getStack() === projections[2]?.getStack()).toBe(false);
		a.update(() => {
			elements[1].style.width = '180px';
		});
		await tick();
		await frame();
		expect(a.stats().active).toBe(0);
		disposals.splice(0).forEach((stop) => stop());
		await Promise.resolve();
		expect(a.stats().participants + b.stats().participants).toBe(0);
		expect(projections.every((projection) => projection?.getStack() === undefined)).toBe(true);
	});

	it('retains child ancestry when a parent attachment is replaced while children survive', async () => {
		const layout = createLayout();
		const parent = document.createElement('div');
		const child = document.createElement('div');
		parent.style.cssText = 'width:200px;height:100px';
		child.style.cssText = 'width:100px;height:40px';
		parent.append(child);
		document.body.append(parent);
		cleanups.push(() => parent.remove());
		const removeParent = layout()(parent);
		const removeChild = layout()(child);
		if (removeChild) cleanups.push(removeChild);
		await Promise.resolve();
		removeParent?.();
		const removeReplacement = layout({ mode: 'position' })(parent);
		if (removeReplacement) cleanups.push(removeReplacement);
		await Promise.resolve();
		expect(
			visualElementStore.get(child)?.projection?.parent ===
				visualElementStore.get(parent)?.projection
		).toBe(true);
	});
});
