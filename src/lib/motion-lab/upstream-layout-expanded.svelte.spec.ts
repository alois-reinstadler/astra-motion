// Motion v13.4.4, 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Source mapping and attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamLayoutExpanded.svelte';
import { updateLayout } from '../motion/index.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await tick();
	await frame();
	await frame();
};
const node = (name = 'box') => document.querySelector<HTMLElement>(`[data-expanded-${name}]`)!;
const rect = (name = 'box') => node(name).getBoundingClientRect();
function near(actual: number, expected: number) {
	expect(Math.abs(actual - expected)).toBeLessThan(1);
}
async function settled(left: number, origin: number) {
	await expect.poll(() => Math.abs(rect().left - origin - left)).toBeLessThan(1);
}

for (const mode of [true, 'x', 'y'] as const)
	it(`layout-axis-matrix: ${mode} projects only its configured axes and reports ordered completion`, async () => {
		const events = vi.fn();
		const view = render(Fixture, { mode, report: events });
		await frames();
		const before = rect();
		flushSync(() => view.component.change());
		await expect.poll(() => events.mock.calls.map(([e]) => e)).toContain('start');
		await expect
			.poll(() => Math.abs(rect().left - before.left - (mode === 'y' ? 200 : 100)))
			.toBeLessThan(1);
		const during = rect();
		near(during.top - before.top, mode === 'x' ? 100 : 50);
		near(during.width, mode === 'y' ? 300 : 200);
		near(during.height, mode === 'x' ? 300 : 250);
		await expect.poll(() => events.mock.calls.map(([e]) => e)).toEqual(['start', 'complete']);
		near(rect().left - before.left, 200);
		near(rect().top - before.top, 100);
		near(rect().width, 300);
		near(rect().height, 300);
	});
it('layout-imperative-clock: layout commits do not collapse an imperative value animation', async () => {
	const view = render(Fixture);
	await frames();
	const animation = view.component.animate();
	await expect.poll(() => view.component.read().value, { interval: 5 }).toBeGreaterThan(0);
	expect(view.component.read().value).toBeLessThan(100);
	await animation;
	expect(view.component.read().value).toBe(100);
	expect(view.component.read().samples.some((v) => v > 0 && v < 100)).toBe(true);
});
for (const scenario of ['no-transform', 'identity'])
	it(`layout-no-containing-block: ${scenario} leaves fixed descendants viewport-positioned`, async () => {
		const view = render(Fixture, { scenario });
		await frames();
		flushSync(() => view.component.rerender());
		await frames();
		const fixed = node('fixed').getBoundingClientRect();
		near(fixed.left, 10);
		near(fixed.top, 10);
		const style = getComputedStyle(node('parent'));
		expect(style.transform).toBe('none');
		expect(style.perspective).toBe('none');
		expect(style.filter).toBe('none');
		expect(style.willChange).toBe('auto');
	});
for (const anchored of [true, false])
	it(`layout-anchor-centering: ${anchored ? 'center anchor' : 'unanchored control'} discriminates relative child centering`, async () => {
		const view = render(Fixture, {
			props: { scenario: 'anchor', anchor: anchored ? { x: 0.5, y: 0.5 } : undefined }
		});
		await frames();
		const initial = rect();
		const parentBefore = rect('parent');
		near(initial.left + initial.width / 2, parentBefore.left + parentBefore.width / 2);
		updateLayout(() => view.component.change());
		// Sample while the linear parent is moving and before the delayed child starts.
		await expect.poll(() => rect('parent').width, { interval: 10 }).toBeGreaterThan(140);
		const parent = rect('parent'),
			child = rect();
		expect(parent.width).toBeLessThan(190);
		const drift =
			Math.abs(child.left + child.width / 2 - parent.left - parent.width / 2) +
			Math.abs(child.top + child.height / 2 - parent.top - parent.height / 2);
		if (anchored) expect(drift).toBeLessThan(2);
		else expect(drift).toBeGreaterThan(5);
		await expect.poll(() => rect('parent').width, { timeout: 1600 }).toBe(300);
	});
it('layout-exit-release: a layout participant completes its managed exit', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'exit', report: done });
	await frames();
	const original = node();
	flushSync(() => view.component.hide());
	expect(original.isConnected).toBe(true);
	await expect.poll(() => original.isConnected).toBe(false);
	expect(done).toHaveBeenCalledExactlyOnceWith('exit');
});
for (const firstMove of [false, true])
	it(`layout-relative-group: relative child follows sibling expansion after own movement=${firstMove}`, async () => {
		const report = vi.fn();
		const view = render(Fixture, { scenario: 'relative', report });
		await frames();
		if (firstMove) {
			flushSync(() => view.component.moveChild());
			await expect
				.poll(() => report.mock.calls.map(([event]) => event))
				.toContain('child-complete');
			near(rect().left - rect('parent').left, 60);
		}
		const before = rect();
		flushSync(() => view.component.change());
		await expect.poll(() => Math.abs(rect().top - before.top - 50)).toBeLessThan(1);
		await expect.poll(() => Math.abs(rect().top - before.top - 100)).toBeLessThan(1);
		flushSync(() => view.component.change(false));
		await expect.poll(() => Math.abs(rect().top - before.top)).toBeLessThan(1);
	});
it('layout-same-flush-undo: reverted geometry never starts obsolete projection', async () => {
	const events = vi.fn();
	const view = render(Fixture, { report: events });
	await frames();
	const before = rect();
	flushSync(() => view.component.undo());
	await frames();
	near(rect().left, before.left);
	near(rect().width, before.width);
	expect(events).not.toHaveBeenCalled();
});
it('layout-relative-follow: delayed child follows parent without double translation', async () => {
	const view = render(Fixture, { scenario: 'delay' });
	await frames();
	const before = rect();
	flushSync(() => view.component.change());
	await expect.poll(() => Math.abs(rect().top - before.top - 50)).toBeLessThan(1);
	near(rect().left, rect('parent').left);
	near(rect().width, 100);
	await expect.poll(() => Math.abs(rect().top - before.top - 100)).toBeLessThan(1);
	near(rect().top, rect('parent').top);
});
it('layout-relative-follow: a dragged layout parent carries its child', async () => {
	render(Fixture, { scenario: 'drag' });
	await frames();
	const parent = node('parent');
	const childBefore = rect();
	const parentBefore = rect('parent');
	const dispatch = (target: EventTarget, type: string, x: number, y: number) =>
		target.dispatchEvent(
			new PointerEvent(type, {
				pointerId: 72,
				pointerType: 'mouse',
				isPrimary: true,
				button: 0,
				buttons: type === 'pointerup' ? 0 : 1,
				clientX: x,
				clientY: y,
				bubbles: true
			})
		);
	try {
		dispatch(parent, 'pointerdown', parentBefore.left + 20, parentBefore.top + 20);
		dispatch(window, 'pointermove', parentBefore.left + 30, parentBefore.top + 30);
		await frame();
		dispatch(window, 'pointermove', parentBefore.left + 130, parentBefore.top + 130);
		await frames();
		const dx = rect('parent').left - parentBefore.left,
			dy = rect('parent').top - parentBefore.top;
		expect(dx).toBeGreaterThan(50);
		expect(dy).toBeGreaterThan(50);
		near(rect().left - childBefore.left, dx);
		near(rect().top - childBefore.top, dy);
		near(rect().width, 100);
	} finally {
		dispatch(window, 'pointerup', parentBefore.left + 130, parentBefore.top + 130);
	}
});
it('layout-resize-recovery: resize settles parent and child and suppresses immediate projection before recovery', async () => {
	const original = { width: window.innerWidth, height: window.innerHeight };
	const view = render(Fixture, { scenario: 'resize' });
	await frames();
	const before = rect('parent');
	const at = (x: number, y: number, width: number, height: number) => {
		const parent = rect('parent'),
			child = rect();
		near(parent.left - before.left, x);
		near(parent.top - before.top, y);
		near(parent.width, width);
		near(parent.height, height);
		near(child.left, parent.left);
		near(child.top, parent.top);
		near(child.width, 100);
		near(child.height, 100);
	};
	try {
		flushSync(() => view.component.change());
		await expect.poll(() => Math.abs(rect('parent').width - 250)).toBeLessThan(1);
		at(50, 50, 250, 150);
		await page.viewport(Math.max(500, original.width - 50), Math.max(500, original.height - 50));
		await frames();
		at(100, 100, 400, 200);
		// A normal 1.2s projection is held at its midpoint; checking after two frames
		// discriminates the resize-suppression path from eventual normal completion.
		flushSync(() => view.component.change(false));
		await frames();
		at(0, 0, 100, 100);
		// Recovery is tested outside Motion's documented quiet window, without
		// asserting its private exact timer boundary.
		await new Promise((resolve) => setTimeout(resolve, 350));
		flushSync(() => view.component.change());
		await expect.poll(() => Math.abs(rect('parent').width - 250)).toBeLessThan(1);
		at(50, 50, 250, 150);
		await expect.poll(() => rect('parent').width, { timeout: 2500 }).toBe(400);
		at(100, 100, 400, 200);
	} finally {
		await page.viewport(original.width, original.height);
		// Restoring the viewport starts another resize quiet period. Let it end
		// before the next test tries to start an unrelated layout animation.
		await frames();
		await new Promise((resolve) => setTimeout(resolve, 350));
	}
});
it('layout-percent-keyframe-race: removing the previous animate prop before keyframes resolve still projects the inserted sibling reflow', async () => {
	const report = vi.fn();
	const view = render(Fixture, { scenario: 'percent-race', report });
	await frames();
	const item = (id: number) => document.querySelector<HTMLElement>(`[data-percent-item="${id}"]`)!;
	expect(document.querySelectorAll('[data-percent-item]')).toHaveLength(2);
	// #3401: commit separate layout snapshots without yielding an animation frame.
	// Only the latest item owns
	// initial/animate; adding item 3 removes both props from the same item-2 node.
	updateLayout(() => view.component.addRaceItem());
	const previous = item(2);
	expect(previous.dataset.percentAnimated).toBe('true');
	expect(previous.style.transform).toContain('100%');
	// Flush Svelte attachment registration without allowing a RAF/keyframe-resolution pass.
	await tick();
	report.mockClear();
	updateLayout(() => view.component.addRaceItem());
	expect(item(2)).toBe(previous);
	expect(previous.dataset.percentAnimated).toBe('false');
	expect(item(3).dataset.percentAnimated).toBe('true');
	await frames();
	await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('percent-start:2');
	// This callback belongs to layout, not to the now-removed ordinary x tween.
	const projected = previous.getBoundingClientRect();
	const naturalLeft = previous.offsetLeft + previous.offsetParent!.getBoundingClientRect().left;
	expect(Number.isFinite(projected.left)).toBe(true);
	expect(Math.abs(projected.left - naturalLeft)).toBeGreaterThan(1);
	expect(previous.style.transform).not.toBe('none');
	expect(previous.style.transform).not.toBe('');
	expect(projected.width).toBeCloseTo(100, 0);
	await expect
		.poll(() => report.mock.calls.map(([event]) => event))
		.toContain('percent-complete:2');
	// Four 100px items + three 10px gaps are centered in the authored 600px row.
	// Removing animate preserves item 2's initial x=100% (another 100px).
	const row = document.querySelector<HTMLElement>('[data-percent-row]')!;
	const expectedLeft = row.getBoundingClientRect().left + (600 - 430) / 2 + 2 * 110 + 100;
	const settled = previous.getBoundingClientRect();
	near(settled.left, expectedLeft);
	near(settled.top, row.getBoundingClientRect().top);
	near(settled.width, 100);
	near(settled.height, 100);
	expect(Math.abs(settled.left - projected.left)).toBeGreaterThan(1);
	await frames();
	near(previous.getBoundingClientRect().left, expectedLeft);
	expect(report.mock.calls.filter(([event]) => event === 'percent-complete:2')).toHaveLength(1);
});
it('layout-dependency-exits: changing dependency retains the outgoing child geometry', async () => {
	const view = render(Fixture, { scenario: 'dependency-exit' });
	await frames();
	const box = node(),
		before = rect();
	flushSync(() => {
		view.component.change();
		view.component.unlock();
		view.component.hide();
	});
	await frame();
	near(box.getBoundingClientRect().left, before.left);
	near(box.getBoundingClientRect().top, before.top);
	near(box.getBoundingClientRect().width, before.width);
	await expect.poll(() => box.isConnected).toBe(false);
});
for (const scenario of ['axis', 'parent-rerender'])
	it(`layout-unchanged-target-callbacks: ${scenario} rerender preserves child pose and parent-relative geometry`, async () => {
		const report = vi.fn();
		const view = render(Fixture, { scenario, report });
		await frames();
		const before = rect(),
			parentBefore = rect('parent');
		flushSync(() => view.component.change());
		await settled(100, before.left);
		const held = rect(),
			parentHeld = rect('parent');
		near(held.left - parentHeld.left, 100);
		near(held.top - parentHeld.top, 50);
		near(held.width, 200);
		near(held.height, 250);
		flushSync(() => {
			view.component.rerender();
		});
		await frames();
		const after = rect(),
			parentAfter = rect('parent');
		near(after.left - parentAfter.left, held.left - parentHeld.left);
		near(after.top - parentAfter.top, held.top - parentHeld.top);
		near(after.width, held.width);
		near(after.height, held.height);
		near(after.left - held.left, parentAfter.left - parentHeld.left);
		near(parentAfter.left, parentBefore.left);
		expect(report.mock.calls.filter(([event]) => event === 'start')).toHaveLength(1);
		await expect
			.poll(() => report.mock.calls.map(([event]) => event))
			.toEqual(['start', 'complete']);
		await expect.poll(() => Math.abs(rect('parent').left - parentBefore.left)).toBeLessThan(1);
		near(rect().left - rect('parent').left, 200);
		near(rect().top - rect('parent').top, 100);
		near(rect().width, 300);
		near(rect().height, 300);
	});
it('layout-portal-boundary: portalled children remain independent of logical parent scaling', async () => {
	const view = render(Fixture, { scenario: 'portal' });
	await frames();
	expect(rect().width).toBe(100);
	flushSync(() => view.component.change());
	await expect.poll(() => rect('parent').width).toBeCloseTo(150, 0);
	near(rect().width, 100);
	near(rect().height, 100);
	near(rect().top, 150);
	await expect.poll(() => rect().top).toBeCloseTo(200, 0);
	near(rect().width, 100);
});
it('layout-new-entry-repeat: newly introduced children follow the active parent projection', async () => {
	const view = render(Fixture, { scenario: 'new-entry' });
	await frames();
	const origin = node('parent').getBoundingClientRect().left;
	for (let cycle = 0; cycle < 2; cycle++) {
		flushSync(() => view.component.change());
		await expect
			.poll(() => Math.abs(node('parent').getBoundingClientRect().left - origin - 50))
			.toBeLessThan(1);
		flushSync(() => view.component.add());
		await frames();
		const added = document.querySelector<HTMLElement>('[data-expanded-entry="1"]')!;
		near(added.getBoundingClientRect().left - node('parent').getBoundingClientRect().left, 170);
		expect(added.getBoundingClientRect().left - origin).toBeGreaterThan(170);
		expect(added.getBoundingClientRect().left - origin).toBeLessThan(270);
		await expect
			.poll(() => Math.abs(added.getBoundingClientRect().left - origin - 270))
			.toBeLessThan(1);
		flushSync(() => {
			view.component.remove();
			view.component.change(false);
		});
		await expect.poll(() => document.querySelector('[data-expanded-entry="1"]')).toBeNull();
		await expect
			.poll(() => Math.abs(node('parent').getBoundingClientRect().left - origin))
			.toBeLessThan(1);
	}
});
it('layout-microtask-measurement: microtask layout changes preserve each expected midpoint', async () => {
	const view = render(Fixture);
	await frames();
	const before = rect();
	for (let i = 0; i < 4; i++) {
		view.component.microtask();
		await expect.poll(() => Math.abs(rect().left - before.left - 100)).toBeLessThan(1);
		await settled(i % 2 === 0 ? 200 : 0, before.left);
	}
});
it('layout-document-scroll: scrolling is not replayed into a later projection', async () => {
	const spacer = document.createElement('div');
	spacer.style.height = '2000px';
	document.body.append(spacer);
	const old = window.scrollY;
	const view = render(Fixture);
	await frames();
	try {
		window.scrollTo(0, 100);
		await expect.poll(() => Math.abs(window.scrollY - 100)).toBeLessThan(1);
		const before = rect();
		flushSync(() => view.component.change());
		await expect.poll(() => Math.abs(rect().top - before.top - 50)).toBeLessThan(1);
		await expect.poll(() => Math.abs(rect().top - before.top - 100)).toBeLessThan(1);
	} finally {
		await view.unmount();
		spacer.remove();
		window.scrollTo(0, old);
	}
});

it('layout-unmount-sibling: removing a sibling projects the remaining relative child', async () => {
	const view = render(Fixture, { scenario: 'unmount' });
	await frames();
	const before = rect();
	flushSync(() => view.component.hide());
	await expect.poll(() => Math.abs(rect().top - before.top + 10)).toBeLessThan(1);
	await expect.poll(() => Math.abs(rect().top - before.top + 20)).toBeLessThan(1);
	near(rect().width, 100);
	near(rect().left, before.left);
});
it('layout-unmount-sibling: bottom-anchored parent resizes while its surviving child stays painted in place', async () => {
	const view = render(Fixture, { scenario: 'anchored-unmount' });
	await frames();
	const parentBefore = rect('parent'),
		childBefore = rect();
	flushSync(() => view.component.hide());
	await expect
		.poll(() => Math.abs(rect('parent').height - parentBefore.height + 70))
		.toBeLessThan(1);
	expect(rect('parent').top).toBeGreaterThan(parentBefore.top);
	for (const field of ['left', 'top', 'width', 'height'] as const)
		near(rect()[field], childBefore[field]);
	await expect
		.poll(() => Math.abs(rect('parent').height - parentBefore.height + 140))
		.toBeLessThan(1);
	for (const field of ['left', 'top', 'width', 'height'] as const)
		near(rect()[field], childBefore[field]);
});
