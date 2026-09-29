// Motion 13.4.4 @ 33f6e72; source mappings and MIT notices: tests/motion-baseline.
import { tick } from 'svelte';
import { afterEach, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamDragLayoutExpanded.svelte';
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async () => {
	await tick();
	await frame();
	await frame();
};
const node = (id = 'target') => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
let activePointer: { x: number; y: number } | undefined;
function pointer(target: EventTarget, type: string, x = 100, y = 100) {
	if (type === 'pointerdown' || (type === 'pointermove' && activePointer)) {
		activePointer = { x, y };
	} else if (type === 'pointerup' || type === 'pointercancel') {
		activePointer = undefined;
	}
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			isPrimary: true,
			pointerType: 'mouse',
			pointerId: 1,
			button: 0,
			clientX: x,
			clientY: y
		})
	);
}
const bounds = (id = 'target') => node(id).getBoundingClientRect();
async function move(x: number, y: number) {
	pointer(window, 'pointermove', x, y);
	await frames();
}
afterEach(async () => {
	if (activePointer) {
		pointer(window, 'pointerup', activePointer.x, activePointer.y);
		await frames();
	}
	window.scrollTo(0, 0);
});
it('drag-nested-measurement: starting sibling does not reset an already-dragged child', async () => {
	render(Fixture);
	await frames();
	const before = bounds();
	pointer(node(), 'pointerdown');
	await move(150, 100);
	pointer(window, 'pointerup', 150, 100);
	await frames();
	expect(bounds().left - before.left).toBeCloseTo(50, 1);
	pointer(node('sibling'), 'pointerdown');
	await frames();
	expect(bounds().left - before.left).toBeCloseTo(50, 1);
});
it.each([false, true])(
	'drag-rerender-stability: unrelated update retains drag/constraints with layout=%s',
	async (layout) => {
		const view = render(Fixture, { mode: 'rerender', childLayout: layout });
		await frames();
		pointer(node(), 'pointerdown');
		await move(140, 130);
		const before = bounds();
		view.component.rerender();
		await frames();
		expect(bounds().left).toBeCloseTo(before.left, 1);
		expect(bounds().top).toBeCloseTo(before.top, 1);
		await move(150, 140);
		expect(bounds().left - before.left).toBeCloseTo(10, 1);
		expect(bounds().top - before.top).toBeCloseTo(10, 1);
	}
);
for (const [parentLayout, childLayout] of [
	[false, false],
	[true, false],
	[false, true],
	[true, true]
]) {
	for (const kind of ['plain', 'constrained', 'elastic', 'opposite']) {
		it(`drag-nested-layout-matrix: parent=${parentLayout} child=${childLayout} ${kind}`, async () => {
			const constrained = kind === 'constrained' || kind === 'elastic';
			const view = render(Fixture, {
				parentLayout,
				childLayout,
				constrained,
				elastic: kind === 'elastic',
				opposite: kind === 'opposite'
			});
			await frames();
			const parent = bounds('parent'),
				child = bounds(),
				descendant = bounds('descendant');
			pointer(node('parent'), 'pointerdown');
			await move(140, 130);
			pointer(window, 'pointerup', 140, 130);
			await frames();
			const dx = kind === 'opposite' ? 0 : 40;
			expect(bounds().left - child.left).toBeCloseTo(dx, 1);
			expect(bounds().top - child.top).toBeCloseTo(30, 1);
			expect(bounds('descendant').left - descendant.left).toBeCloseTo(dx, 1);
			pointer(node(), 'pointerdown');
			await move(constrained ? 260 : 140, constrained ? 260 : 130);
			pointer(window, 'pointerup', constrained ? 260 : 140, constrained ? 260 : 130);
			if (constrained) {
				await expect.poll(() => view.component.inspect().x).toBeCloseTo(60, 1);
				await expect.poll(() => view.component.inspect().y).toBeCloseTo(60, 1);
			} else await frames();
			if (kind === 'opposite') {
				expect(view.component.inspect().x).toBe(40);
				expect(view.component.inspect().y).toBe(0);
				expect(bounds('parent').top - parent.top).toBeCloseTo(60, 1);
			} else {
				expect(bounds('parent').left - parent.left).toBeCloseTo(40, 1);
				expect(bounds('parent').top - parent.top).toBeCloseTo(30, 1);
				expect(bounds().left - child.left).toBeCloseTo(40 + (constrained ? 60 : 40), 1);
			}
			expect(bounds('descendant').left - bounds().left).toBeCloseTo(
				descendant.left - child.left,
				1
			);
		});
	}
}
it('drag-document-scroll: scrolled absolute bounds reach the visible bottom', async () => {
	render(Fixture, { mode: 'document' });
	await frames();
	window.scrollTo(0, 250);
	await frames();
	expect(window.scrollY).toBeGreaterThan(100);
	pointer(node(), 'pointerdown');
	await move(100, 1000);
	pointer(window, 'pointerup', 100, 1000);
	await frames();
	expect(bounds().bottom).toBeCloseTo(bounds('host').bottom, 1);
});
it('drag-document-scroll: stationary pointer compensates window scroll and next move', async () => {
	render(Fixture, { mode: 'window-scroll' });
	await frames();
	window.scrollTo(0, 250);
	await frames();
	pointer(node(), 'pointerdown');
	await move(130, 130);
	const before = bounds();
	window.scrollBy(0, 40);
	await frames();
	expect(bounds().top).toBeCloseTo(before.top, 1);
	await move(140, 140);
	expect(bounds().top - before.top).toBeCloseTo(10, 1);
});
it.each(['state', 'state-with-offset', 'dom'])(
	'drag-resize-self: %s growth refreshes element bounds',
	async (method) => {
		const view = render(Fixture, { mode: 'resize' });
		await frames();
		if (method === 'state-with-offset') {
			pointer(node(), 'pointerdown');
			await move(140, 140);
			pointer(window, 'pointerup', 140, 140);
			await frames();
			expect(view.component.inspect().x).toBe(40);
		}
		if (method === 'dom') {
			node().style.width = '140px';
			node().style.height = '140px';
		} else view.component.resize();
		await frames();
		expect(bounds().width).toBe(140);
		pointer(node(), 'pointerdown');
		await move(1000, 1000);
		pointer(window, 'pointerup', 1000, 1000);
		await frames();
		expect(bounds().right).toBeCloseTo(bounds('host').right, 1);
		expect(bounds().bottom).toBeCloseTo(bounds('host').bottom, 1);
	}
);
it.each(['scale(.5)', 'scale(2)', 'rotate(180deg)'])(
	'drag-transformed-parent: %s tracks screen pointer through coordinate adapter',
	async (transform) => {
		render(Fixture, { mode: 'transform', transform });
		await frames();
		const before = bounds();
		pointer(node(), 'pointerdown');
		await move(150, 140);
		expect(bounds().left - before.left).toBeCloseTo(50, 1);
		expect(bounds().top - before.top).toBeCloseTo(40, 1);
	}
);
it('drag-container-scroll-resume: next movement adds only pointer displacement after scroll compensation', async () => {
	render(Fixture, { mode: 'container-scroll', axis: 'y' });
	await frames();
	pointer(node(), 'pointerdown');
	await move(100, 130);
	const before = bounds();
	node('host').scrollTop = 40;
	await frames();
	expect(bounds().top).toBeCloseTo(before.top, 1);
	await move(100, 150);
	expect(bounds().top - before.top).toBeCloseTo(20, 1);
});
it('drag-snap-presence: remove while returning and re-enter at authored origin', async () => {
	const view = render(Fixture, { mode: 'snap-presence' });
	await frames();
	const before = bounds();
	pointer(node(), 'pointerdown');
	await move(150, 100);
	expect(bounds().left - before.left).toBeGreaterThan(20);
	pointer(window, 'pointerup', 150, 100);
	const outgoing = node();
	view.component.toggle();
	await tick();
	expect(outgoing.isConnected).toBe(true);
	await expect
		.poll(() => Number(getComputedStyle(outgoing).opacity), { interval: 10 })
		.toBeLessThan(0.95);
	expect(Number(getComputedStyle(outgoing).opacity)).toBeGreaterThan(0);
	expect(outgoing.isConnected).toBe(true);
	await expect.poll(() => document.querySelector('[data-testid="target"]')).toBeNull();
	view.component.toggle();
	await frames();
	await expect.poll(() => bounds().left).toBeCloseTo(before.left, 1);
	expect(bounds().top).toBeCloseTo(before.top, 1);
});
it('drag-snap-shared-swap: shared destination and reverse swap leave no residual drag transform', async () => {
	const view = render(Fixture, { mode: 'snap-swap' });
	await frames();
	const target = node(),
		other = node('other-tile');
	const before = bounds(),
		otherBefore = bounds('other-tile');
	expect(view.component.inspect().tiles).toEqual([0, 1]);
	expect(otherBefore.left - before.left).toBe(100);
	pointer(target, 'pointerdown');
	await move(150, 100);
	const released = view.component.inspect().x;
	expect(released).toBeGreaterThan(20);
	pointer(window, 'pointerup', 150, 100);
	await frame();
	expect(view.component.inspect().x).toBeGreaterThan(0);
	expect(view.component.inspect().x).toBeLessThanOrEqual(released);
	view.component.swap();
	await tick();
	expect(view.component.inspect().tiles).toEqual([1, 0]);
	// The React effect-remount regression adapts to Svelte's persistent keyed nodes.
	expect(node()).toBe(target);
	expect(node('other-tile')).toBe(other);
	await expect.poll(() => view.component.inspect().x).toBeCloseTo(0, 1);
	await expect.poll(() => bounds().left).toBeCloseTo(otherBefore.left, 1);
	await expect.poll(() => bounds('other-tile').left).toBeCloseTo(before.left, 1);
	expect(bounds().top).toBeCloseTo(before.top, 1);
	view.component.swap();
	await frames();
	expect(view.component.inspect().tiles).toEqual([0, 1]);
	expect(node()).toBe(target);
	expect(node('other-tile')).toBe(other);
	await expect.poll(() => bounds().left).toBeCloseTo(before.left, 1);
	await expect.poll(() => bounds('other-tile').left).toBeCloseTo(otherBefore.left, 1);
	expect(bounds().top).toBeCloseTo(before.top, 1);
	expect(bounds('other-tile').top).toBeCloseTo(otherBefore.top, 1);
});
for (const layout of [false, true])
	for (const axis of [true, 'x', 'y'] as const) {
		it(`drag-svg-matrix: layout=${layout} axis=${axis} respects both corners`, async () => {
			const view = render(Fixture, {
				mode: 'svg',
				childLayout: layout,
				axis,
				constrained: true,
				svgScale: 'matching'
			});
			await frames();
			pointer(node(), 'pointerdown');
			await move(250, 250);
			expect(view.component.inspect().x).toBe(axis === 'y' ? 0 : 20);
			expect(view.component.inspect().y).toBe(axis === 'x' ? 0 : 20);
			await move(-100, -100);
			expect(view.component.inspect().x).toBe(axis === 'y' ? 0 : -5);
			expect(view.component.inspect().y).toBe(axis === 'x' ? 0 : -5);
		});
	}
it.each(['matching', 'nonuniform'])(
	'drag-svg-matrix: %s viewBox maps physical deltas on both axes',
	async (svgScale) => {
		const view = render(Fixture, { mode: 'svg', svgScale });
		await frames();
		pointer(node(), 'pointerdown');
		await move(160, 140);
		expect(view.component.inspect().x).toBeCloseTo(svgScale === 'matching' ? 60 : 20, 1);
		expect(view.component.inspect().y).toBeCloseTo(svgScale === 'matching' ? 40 : 20, 1);
	}
);
it.each([
	{ layout: false, offset: 40 },
	{ layout: true, offset: 40 },
	{ layout: false, offset: '50%' }
])(
	'drag-initial-offset: layout=$layout offset=$offset retains authored origin',
	async ({ layout, offset }) => {
		render(Fixture, { mode: 'offset', childLayout: layout, initialX: offset, initialY: offset });
		await frames();
		const before = bounds();
		pointer(node(), 'pointerdown');
		await move(140, 130);
		expect(bounds().left - before.left).toBeCloseTo(40, 1);
		expect(bounds().top - before.top).toBeCloseTo(30, 1);
	}
);
for (const axis of [true, 'x', 'y'] as const) {
	it(`drag-layout-axes: layout=true axis=${axis} respects pointer displacement and constraints`, async () => {
		const view = render(Fixture, { mode: 'axes', childLayout: true, axis, constrained: true });
		await frames();
		pointer(node(), 'pointerdown');
		await move(140, 130);
		expect(view.component.inspect().x).toBe(axis === 'y' ? 0 : 40);
		expect(view.component.inspect().y).toBe(axis === 'x' ? 0 : 30);
		await move(300, 300);
		expect(view.component.inspect().x).toBe(axis === 'y' ? 0 : 60);
		expect(view.component.inspect().y).toBe(axis === 'x' ? 0 : 60);
		await move(-200, -200);
		expect(view.component.inspect().x).toBe(axis === 'y' ? 0 : -20);
		expect(view.component.inspect().y).toBe(axis === 'x' ? 0 : -20);
	});
}
it.each(['target', 'descendant'])(
	'drag-layout-axes: unprojected two-axis drag from %s',
	async (id) => {
		const view = render(Fixture, { mode: 'axes' });
		await frames();
		pointer(node(id), 'pointerdown');
		await move(140, 130);
		expect(view.component.inspect().x).toBe(40);
		expect(view.component.inspect().y).toBe(30);
	}
);

it('drag-layout-axes: layout-enabled drag retains its initial direction lock', async () => {
	const view = render(Fixture, { mode: 'axes', childLayout: true, direction: true });
	await frames();
	pointer(node(), 'pointerdown');
	await move(100, 150);
	await move(180, 180);
	expect(view.component.inspect().x).toBe(0);
	expect(view.component.inspect().y).toBeGreaterThan(0);
});
