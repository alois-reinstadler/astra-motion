import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync, tick } from 'svelte';
import { beforeCommit, beginPresenceSnapshot, currentPresenceSnapshot } from '../motion/commit.js';
import { createPresenceBoxes, observePresenceBoxes } from '../motion/presence-measure.js';
import { updateLayout } from '../motion/layout.js';
import Fixture from './PopResize.svelte';

it('preserves an owned origin through observation and repeated capture, then captures fresh geometry', () => {
	const node = document.createElement('div');
	node.style.cssText = 'position:relative;width:100px;height:20px';
	document.body.append(node);
	const boxes = createPresenceBoxes();
	const close = beginPresenceSnapshot();
	try {
		boxes.capture(node);
		const origin = boxes.get(node);
		node.style.width = '200px';
		boxes.observe(node);
		boxes.capture(node);
		expect(boxes.get(node)).toBe(origin);
		expect(boxes.get(node)?.width).toBe('100px');
		const closeNested = beginPresenceSnapshot();
		const owner = currentPresenceSnapshot();
		closeNested();
		expect(currentPresenceSnapshot()).toBe(owner);
		close();
		expect(boxes.get(node)?.width).toBe('200px');
		const closeNext = beginPresenceSnapshot();
		try {
			close();
			expect(currentPresenceSnapshot()).not.toBeUndefined();
			boxes.capture(node);
			node.style.width = '300px';
			boxes.observe(node);
			expect(boxes.get(node)?.width).toBe('200px');
		} finally {
			closeNext();
		}
		expect(boxes.get(node)?.width).toBe('300px');
	} finally {
		close();
		node.remove();
	}
});

it('retains owned boxes when a presence tracker is reinstalled or disposed during publication', () => {
	const subscriptions = beforeCommit.size;
	const node = document.createElement('div');
	node.style.cssText = 'width:100px;height:20px';
	document.body.append(node);
	const boxes = createPresenceBoxes();
	let release = observePresenceBoxes([node], boxes, () => true);
	const close = beginPresenceSnapshot();
	try {
		for (const capture of beforeCommit) capture();
		const origin = boxes.get(node);
		node.style.width = '200px';
		release();
		release = observePresenceBoxes([node], boxes, () => true);
		expect(boxes.get(node)).toBe(origin);
		release();
		expect(beforeCommit.size).toBe(subscriptions);
		expect(boxes.get(node)?.width).toBe('100px');
	} finally {
		close();
		release();
		node.remove();
	}
});

it('shares the outer origin with nested updates and releases it after a throwing mutation', async () => {
	const screen = render(Fixture, { transaction: true });
	await tick();
	let outer: symbol | undefined;
	updateLayout(() => {
		outer = currentPresenceSnapshot();
		updateLayout(() => expect(currentPresenceSnapshot()).toBe(outer));
	});
	expect(outer).toBeTypeOf('symbol');
	expect(currentPresenceSnapshot()).toBeUndefined();
	expect(() =>
		updateLayout(() => {
			throw new Error('mutation failed');
		})
	).toThrow('mutation failed');
	expect(currentPresenceSnapshot()).toBeUndefined();
	flushSync(() => screen.component.toggle());
	await tick();
	expect(
		getComputedStyle(document.querySelector<HTMLElement>('[data-pop-resize-text]')!).position
	).toBe('absolute');
	await screen.unmount();
});

it('rejects explicit mutation reentry during capture and releases ownership after capture failure', () => {
	let changed = false;
	const capture = () =>
		updateLayout(() => {
			changed = true;
		});
	beforeCommit.add(capture);
	try {
		expect(() => updateLayout(() => {})).toThrow('while capturing layout snapshots');
		expect(changed).toBe(false);
		expect(currentPresenceSnapshot()).toBeUndefined();
	} finally {
		beforeCommit.delete(capture);
	}
	updateLayout(() => {
		changed = true;
	});
	expect(changed).toBe(true);
});

it('coordinates sibling roots without replacing a nested exit origin', async () => {
	const a = render(Fixture, { transaction: true });
	const b = render(Fixture, { transaction: true });
	try {
		await tick();
		const texts = [...document.querySelectorAll<HTMLElement>('[data-pop-resize-text]')];
		const original = getComputedStyle(texts[1]).width;
		updateLayout(() => {
			const owner = currentPresenceSnapshot();
			a.component.resize(240);
			b.component.toggle();
			expect(currentPresenceSnapshot()).toBe(owner);
		});
		await tick();
		expect(currentPresenceSnapshot()).toBeUndefined();
		expect(getComputedStyle(texts[0]).position).not.toBe('absolute');
		expect(getComputedStyle(texts[1]).position).toBe('absolute');
		expect(getComputedStyle(texts[1]).width).toBe(original);
	} finally {
		await a.unmount();
		await b.unmount();
	}
});
