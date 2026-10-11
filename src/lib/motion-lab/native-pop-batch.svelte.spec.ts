import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { visualElementStore } from 'motion-dom';
import { beforeCommit, layoutBridge, queueLayoutMutation } from '../motion/commit.js';
import { createLayout } from '../motion/layout.js';
import { popLayout } from '../motion/presence.js';
import Fixture from './NativePopBatch.svelte';

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frames = async () => {
	await new Promise(requestAnimationFrame);
	await new Promise(requestAnimationFrame);
};
const cells = () => [...document.querySelectorAll<HTMLElement>('[data-native-cell]')];

it.each([true, false])(
	'coalesces native event tasks with pop=%s into one flow transaction',
	async (pop) => {
		const container = document.createElement('div');
		container.style.cssText = 'position:relative;display:flex';
		document.body.append(container);
		const layout = createLayout({ transition: { duration: 0 }, reducedMotion: 'never' });
		const releases: (() => void)[] = [];
		const nodes = Array.from({ length: 20 }, () => {
			const node = document.createElement('div');
			node.style.cssText = 'width:20px;height:20px';
			container.append(node);
			releases.push(layout()(node)!);
			if (pop) releases.push(popLayout()(node)!);
			return node;
		});
		await frames();
		const schedule = layoutBridge.schedule;
		const queued: (() => void)[] = [];
		let snapshots = 0;
		const capture = () => snapshots++;
		beforeCommit.add(capture);
		layoutBridge.schedule = (flush) => queued.push(flush);
		try {
			for (const node of nodes) {
				node.dispatchEvent(new Event('outrostart'));
				// Separate tasks reproduce WAAPI's delivery of sibling transition events.
				await pause(0);
			}
			expect(snapshots).toBe(0);
			expect(queued).toHaveLength(1);
			queued.shift()!();
			expect(snapshots).toBe(1);
			expect(
				nodes.every((node) => visualElementStore.get(node)?.projection?.isPresent === false)
			).toBe(true);
			expect(nodes.filter((node) => node.style.position === 'absolute')).toHaveLength(pop ? 20 : 0);
		} finally {
			beforeCommit.delete(capture);
			layoutBridge.schedule = schedule;
			for (const release of releases) release();
			for (const flush of queued) flush();
			container.remove();
			await frames();
		}
		expect(layout.stats().participants).toBe(0);
	}
);

it('preserves immediate shared-stack reversal while deferring the native commit', async () => {
	const container = document.createElement('div');
	container.style.position = 'relative';
	document.body.append(container);
	const layout = createLayout({ transition: { duration: 0 } });
	const nodes = [document.createElement('div'), document.createElement('div')];
	const releases = nodes.map((node) => {
		node.style.cssText = 'width:20px;height:20px';
		container.append(node);
		return layout({ id: 'shared-native' })(node)!;
	});
	await frames();
	const first = visualElementStore.get(nodes[0])!.projection!;
	const second = visualElementStore.get(nodes[1])!.projection!;
	const schedule = layoutBridge.schedule;
	const queued: (() => void)[] = [];
	layoutBridge.schedule = (flush) => queued.push(flush);
	try {
		nodes[1].dispatchEvent(new Event('outrostart'));
		expect(second.isPresent).toBe(false);
		expect(second.getLead()).toBe(first);
		nodes[1].dispatchEvent(new Event('introstart'));
		expect(second.isPresent).toBe(true);
		expect(second.getLead()).toBe(second);
		expect(queued).toHaveLength(1);
		queued.shift()!();
	} finally {
		layoutBridge.schedule = schedule;
		for (const release of releases) release();
		for (const flush of queued) flush();
		container.remove();
		await frames();
	}
});

it('restores a real Svelte batch reversed during reorder and resize', async () => {
	const view = render(Fixture);
	await frames();
	const original = cells();
	flushSync(() => view.component.reorderAndResize());
	flushSync(() => view.component.remove());
	await expect
		.poll(() => cells().filter((node) => node.style.position === 'absolute').length)
		.toBe(6);
	expect(cells()).toHaveLength(12);
	flushSync(() => view.component.reset());
	await expect
		.poll(() => cells().filter((node) => node.style.position === 'absolute').length)
		.toBe(0);
	await expect.poll(() => view.component.stats().active).toBe(0);
	expect(cells().every((node) => original.includes(node))).toBe(true);
	for (const node of cells()) {
		const matrix = new DOMMatrix(getComputedStyle(node).transform);
		expect(matrix.m41).toBeCloseTo(0, 3);
		expect(matrix.m42).toBeCloseTo(0, 3);
	}
	await view.unmount();
	await frames();
	expect(view.component.stats().participants).toBe(0);
});

it('disposes zero-duration native exits without a stale flow write', async () => {
	const view = render(Fixture, { duration: 0 });
	await frames();
	flushSync(() => view.component.remove());
	await expect.poll(() => cells().length).toBe(6);
	await frames();
	expect(cells().every((node) => node.style.position !== 'absolute')).toBe(true);
	expect(view.component.stats().participants).toBe(6);
	await view.unmount();
	await frames();
	expect(view.component.stats().participants).toBe(0);
});

it('keeps nested parent and child boxes through popping and restoration', () => {
	const outer = document.createElement('div');
	const parent = document.createElement('div');
	const child = document.createElement('div');
	outer.style.cssText = 'position:relative;width:360px;height:180px';
	parent.style.cssText =
		'position:relative;width:50%;padding:12px;border:2px solid;box-sizing:border-box';
	// Native popLayout uses integer offset geometry; isolate nested batching here.
	child.style.cssText = 'width:50%;height:32px;margin:5px 3px';
	outer.append(parent);
	parent.append(child);
	document.body.append(outer);
	const releases = [popLayout()(parent)!, popLayout()(child)!];
	const previous = { schedule: layoutBridge.schedule, update: layoutBridge.update };
	const queued: (() => void)[] = [];
	layoutBridge.schedule = (flush) => queued.push(flush);
	delete layoutBridge.update;
	const initial = child.getBoundingClientRect();
	try {
		parent.dispatchEvent(new Event('outrostart'));
		child.dispatchEvent(new Event('outrostart'));
		queued.shift()!();
		const popped = child.getBoundingClientRect();
		expect(popped.left).toBeCloseTo(initial.left, 2);
		expect(popped.top).toBeCloseTo(initial.top, 2);
		expect(popped.width).toBeCloseTo(initial.width, 2);
		parent.dispatchEvent(new Event('introstart'));
		child.dispatchEvent(new Event('introstart'));
		queued.shift()!();
		expect(parent.style.position).toBe('relative');
		expect(child.style.position).toBe('');
		expect(child.getBoundingClientRect().width).toBeCloseTo(initial.width, 2);
	} finally {
		Object.assign(layoutBridge, previous);
		for (const release of releases) release();
		outer.remove();
	}
});

it('validates the actual containing block after relational CSS sees sibling pops', () => {
	const container = document.createElement('div');
	const style = document.createElement('style');
	style.textContent =
		'.native-pop-relational{position:relative}.native-pop-relational:has([style*="absolute"]){position:static}';
	container.className = 'native-pop-relational';
	document.head.append(style);
	document.body.append(container);
	const nodes = [document.createElement('div'), document.createElement('div')];
	const releases = nodes.map((node) => {
		node.style.cssText = 'width:20px;height:20px';
		container.append(node);
		return popLayout()(node)!;
	});
	// WebKit currently matches :has([style]) without invalidating the parent's
	// computed style on inline CSS writes. Probe that browser behavior directly;
	// rollback is required only when the actual containing block changes.
	expect(getComputedStyle(container).position).toBe('relative');
	nodes[0].style.position = 'absolute';
	expect(container.matches(':has([style*="absolute"])')).toBe(true);
	const changesContainingBlock = getComputedStyle(container).position === 'static';
	nodes[0].style.removeProperty('position');
	expect(getComputedStyle(container).position).toBe('relative');
	const previous = { schedule: layoutBridge.schedule, update: layoutBridge.update };
	const queued: (() => void)[] = [];
	layoutBridge.schedule = (flush) => queued.push(flush);
	delete layoutBridge.update;
	try {
		for (const node of nodes) node.dispatchEvent(new Event('outrostart'));
		if (changesContainingBlock) {
			expect(() => queued.shift()!()).toThrow('direct parent must establish a positioning context');
			expect(nodes.every((node) => !node.style.position)).toBe(true);
		} else {
			queued.shift()!();
			expect(nodes.every((node) => node.style.position === 'absolute')).toBe(true);
			expect(container.matches(':has([style*="absolute"])')).toBe(true);
		}
		expect(getComputedStyle(container).position).toBe('relative');
		expect(nodes.every((node) => node.offsetParent === container)).toBe(true);
	} finally {
		Object.assign(layoutBridge, previous);
		for (const release of releases) release();
		container.remove();
		style.remove();
	}
});

it('rolls back native styles and recovers after a sibling removes the containing block', () => {
	const container = document.createElement('div');
	container.style.position = 'relative';
	const node = document.createElement('div');
	const sibling = document.createElement('div');
	node.style.cssText = 'width:20px;height:20px;left:7px!important';
	container.append(node, sibling);
	document.body.append(container);
	const release = popLayout()(node)!;
	const previous = { schedule: layoutBridge.schedule, update: layoutBridge.update };
	const queued: (() => void)[] = [];
	layoutBridge.schedule = (flush) => queued.push(flush);
	delete layoutBridge.update;
	try {
		node.dispatchEvent(new Event('outrostart'));
		// An independent sibling write changes real browser containing-block
		// geometry after native pop applies, with no relational CSS dependency.
		queueLayoutMutation({
			element: sibling,
			prepare() {},
			apply() {
				container.style.position = 'static';
			},
			validate() {},
			rollback() {
				container.style.position = 'relative';
			}
		});
		expect(() => queued.shift()!()).toThrow('direct parent must establish a positioning context');
		expect(node.style.position).toBe('');
		expect(node.style.left).toBe('7px');
		expect(node.style.getPropertyPriority('left')).toBe('important');
		expect(node.offsetParent).toBe(container);
		node.dispatchEvent(new Event('introstart'));
		queued.shift()!();
		node.dispatchEvent(new Event('outrostart'));
		queued.shift()!();
		expect(node.style.position).toBe('absolute');
		expect(node.offsetParent).toBe(container);
		node.dispatchEvent(new Event('introstart'));
		queued.shift()!();
		expect(node.style.position).toBe('');
		expect(node.style.left).toBe('7px');
		expect(node.style.getPropertyPriority('left')).toBe('important');
	} finally {
		Object.assign(layoutBridge, previous);
		release();
		container.remove();
	}
});
