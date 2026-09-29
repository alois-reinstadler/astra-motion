// Motion 13.4.4 @ 33f6e72; source mappings and MIT notices: tests/motion-baseline.
import { tick } from 'svelte';
import { afterEach, expect, it } from 'vitest';
import { userEvent, page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { visualElementStore, AsyncMotionValueAnimation } from 'motion-dom';
import Fixture from './UpstreamReorderExpanded.svelte';
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async () => {
	await tick();
	await frame();
	await frame();
};
const node = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const item = (id: number) => node(`item-${id}`);
let activePointer: { x: number; y: number } | undefined;
function pointer(target: EventTarget, type: string, x: number, y: number) {
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
afterEach(async () => {
	if (activePointer) {
		pointer(window, 'pointerup', activePointer.x, activePointer.y);
		await frames();
	}
	window.scrollTo(0, 0);
});
async function start(id: number) {
	const r = item(id).getBoundingClientRect();
	const p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
	pointer(item(id), 'pointerdown', p.x, p.y);
	await frame();
	return p;
}
async function move(x: number, y: number) {
	pointer(window, 'pointermove', x, y);
	await frames();
}
async function release(x: number, y: number) {
	pointer(window, 'pointerup', x, y);
	await frames();
}
const renderedOrder = () =>
	[...document.querySelectorAll<HTMLElement>('[data-item]')].map((n) => Number(n.dataset.item));

it('reorder-visuals: entering content and changing label finish through overlapping insertions and drag', async () => {
	const view = render(Fixture, { layout: 'row', axis: 'x' });
	await frames();
	await expect.poll(() => getComputedStyle(item(0)).opacity).toBe('1');
	expect(node('label-0').getBoundingClientRect().width).toBe(48);
	expect(getComputedStyle(node('content-0')).opacity).toBe('0.35');
	const opacity = visualElementStore.get(node('content-0'))!.getValue('opacity')!;
	let animation: AsyncMotionValueAnimation<number> | undefined;
	const unsubscribe = opacity.on('animationStart', () => {
		const current = opacity.animation;
		if (!(current instanceof AsyncMotionValueAnimation)) return;
		animation = current;
		animation.pause();
	});
	try {
		view.component.animateVisuals();
		view.component.insert(4);
		await expect.poll(() => Boolean(animation)).toBe(true);
		const enteringAnimation = animation!;
		// Hold the actual finite clock across insertion commits. A frame wait
		// cannot guarantee it is still in flight when the test resumes.
		enteringAnimation.time = enteringAnimation.duration / 3;
		await frames();
		view.component.insert(5);
		await frames();
		expect(opacity.animation).toBe(enteringAnimation);
		expect(renderedOrder()).toEqual([0, 1, 2, 3, 4, 5]);
		const entering = Number(getComputedStyle(node('content-0')).opacity);
		expect(entering).toBeGreaterThan(0.35);
		expect(entering).toBeLessThan(1);
		const p = await start(0);
		pointer(window, 'pointermove', p.x + 120, p.y);
		// Begin the drag while that same content animation is intermediate,
		// then let playback finish naturally through the drag and release.
		enteringAnimation.play();
		await frames();
		await release(p.x + 120, p.y);
	} finally {
		unsubscribe();
	}

	await expect.poll(() => view.component.read().values[0]).toBe(1);
	await expect.poll(() => getComputedStyle(node('content-0')).opacity).toBe('1');
	await expect.poll(() => node('label-0').getBoundingClientRect().width).toBeCloseTo(132, 1);
	expect(node('label-0').textContent).toContain('Expanded label');
	expect(renderedOrder()).toEqual(view.component.read().values);
});
it('reorder-presence-membership: double removal stays removed and new items reorder', async () => {
	const view = render(Fixture, { layout: 'column', axis: 'y' });
	await frames();
	await expect.poll(() => getComputedStyle(item(1)).opacity).toBe('1');
	const outgoing = item(1);
	view.component.remove(1);
	await tick();
	expect(view.component.read().values).toEqual([0, 2, 3]);
	expect(outgoing.isConnected).toBe(true);
	await expect
		.poll(() => Number(getComputedStyle(outgoing).opacity), { interval: 10 })
		.toBeLessThan(0.95);
	expect(Number(getComputedStyle(outgoing).opacity)).toBeGreaterThan(0);
	expect(outgoing.isConnected).toBe(true);
	view.component.remove(1);
	await tick();
	expect(outgoing.isConnected).toBe(true);
	await expect.poll(() => document.querySelector('[data-testid="item-1"]')).toBeNull();
	expect(view.component.read().exits).toBe(1);
	view.component.insert(4);
	await frames();
	const p = await start(4);
	await move(p.x, p.y - 100);
	await release(p.x, p.y - 100);
	await expect.poll(() => view.component.read().values).toEqual([0, 2, 4, 3]);
	expect(renderedOrder()).toEqual([0, 2, 4, 3]);
	expect(document.querySelector('[data-testid="item-1"]')).toBeNull();
});
it.each(['x', 'y'] as const)(
	'reorder-axis-traversal: repeated %s traversal preserves exact order and alignment',
	async (axis) => {
		const view = render(Fixture, { layout: axis === 'x' ? 'row' : 'column', axis });
		await frames();
		const origin = item(0).getBoundingClientRect();
		for (const [from, to, expected] of [
			[0, 1, [1, 0, 2, 3]],
			[0, 2, [1, 2, 0, 3]],
			[0, 2, [1, 0, 2, 3]]
		] as const) {
			const destination = item(to).getBoundingClientRect();
			const p = await start(from);
			const x = axis === 'x' ? destination.left + destination.width / 2 : p.x;
			const y = axis === 'y' ? destination.top + destination.height / 2 : p.y;
			await move(x, y);
			await expect.poll(() => view.component.read().values).toEqual([...expected]);
			await release(x, y);
			// Every neighbor must finish projecting before it becomes the next destination.
			for (const [index, id] of expected.entries()) {
				await expect
					.poll(() => item(id).getBoundingClientRect()[axis === 'x' ? 'left' : 'top'])
					.toBeCloseTo(
						(axis === 'x' ? origin.left : origin.top) + index * (axis === 'x' ? 100 : 80),
						1
					);
				expect(item(id).getBoundingClientRect()[axis === 'x' ? 'top' : 'left']).toBeCloseTo(
					axis === 'x' ? origin.top : origin.left,
					1
				);
			}
			expect(renderedOrder()).toEqual([...expected]);
		}
	}
);
it.each(['up', 'scrolled-container', 'page-scroll'])(
	'reorder-scroll-edges: %s uses correct edge and stops after release',
	async (mode) => {
		const view = render(Fixture, { mode: mode === 'up' ? '' : mode, count: 14 });
		await frames();
		const scroller = node('scroller');
		if (mode === 'up') {
			scroller.scrollTop = 180;
			await frames();
		}
		if (mode === 'scrolled-container') {
			window.scrollTo(0, 250);
			await frames();
			expect(window.scrollY).toBeGreaterThan(100);
		}
		const id = mode === 'up' ? 3 : 0;
		const p = await start(id);
		const edge = scroller.getBoundingClientRect();
		const targetY =
			mode === 'up'
				? edge.top + 3
				: mode === 'page-scroll'
					? window.innerHeight - 3
					: edge.bottom - 3;
		const before = mode === 'page-scroll' ? window.scrollY : scroller.scrollTop;
		await move(p.x, targetY);
		if (mode === 'up') await expect.poll(() => scroller.scrollTop).toBeLessThan(before - 10);
		else
			await expect
				.poll(() => (mode === 'page-scroll' ? window.scrollY : scroller.scrollTop))
				.toBeGreaterThan(before + 10);
		await release(p.x, targetY);
		const stopped = mode === 'page-scroll' ? window.scrollY : scroller.scrollTop;
		await frames();
		expect(mode === 'page-scroll' ? window.scrollY : scroller.scrollTop).toBeCloseTo(stopped, 1);
		expect(view.component.read().values).toHaveLength(14);
	}
);
it.each(['row', 'column', 'wrap', 'wrap-rtl', 'grid'])(
	'reorder-detected-layouts: auto %s performs exact controlled reorder',
	async (layout) => {
		const view = render(Fixture, { layout });
		await frames();
		const p = await start(0);
		const target = item(1).getBoundingClientRect();
		await move(target.left + 40, target.top + 30);
		await release(target.left + 40, target.top + 30);
		await expect.poll(() => view.component.read().values).toEqual([1, 0, 2, 3]);
		expect(renderedOrder()).toEqual([1, 0, 2, 3]);
		expect(Math.abs(layout === 'column' ? target.top - p.y : target.left - p.x)).toBeGreaterThan(
			20
		);
	}
);
it('reorder-detected-layouts: changed detected axis actually reorders on the new axis', async () => {
	const view = render(Fixture);
	await frames();
	view.component.changeLayout('row');
	await frames();
	await expect
		.poll(() => item(1).getBoundingClientRect().left - item(0).getBoundingClientRect().left)
		.toBeCloseTo(100, 1);
	const p = await start(0);
	await move(p.x + 100, p.y);
	await release(p.x + 100, p.y);
	await expect.poll(() => view.component.read().values).toEqual([1, 0, 2, 3]);
});
it('reorder-constraint-resize: idle items retain slots, stacking and native click targets', async () => {
	const view = render(Fixture, { layout: 'row', axis: 'x', mode: 'constraints' });
	await frames();
	const before = item(2).getBoundingClientRect();
	view.component.resize();
	window.dispatchEvent(new Event('resize'));
	await frames();
	expect(item(2).getBoundingClientRect().left).toBeCloseTo(before.left, 1);
	expect(getComputedStyle(item(2)).zIndex).toBe('auto');
	await userEvent.click(item(2));
	expect(view.component.read().selected).toBe(2);
});
it('reorder-scaled-parent: scaled item follows screen pointer then settles into aligned order', async () => {
	const view = render(Fixture, { scaled: true, axis: 'y' });
	await frames();
	const before = item(0).getBoundingClientRect();
	const p = await start(0);
	await move(p.x, p.y + 35);
	expect(item(0).getBoundingClientRect().top - before.top).toBeCloseTo(35, 1);
	await expect.poll(() => view.component.read().values).toEqual([1, 0, 2, 3]);
	await release(p.x, p.y + 35);
	await expect
		.poll(() => item(0).getBoundingClientRect().top - item(1).getBoundingClientRect().bottom)
		.toBeCloseTo(10, 1);
	expect(renderedOrder()).toEqual([1, 0, 2, 3]);
});
it('reorder-virtualized: visible reorder preserves all unmeasured controlled values', async () => {
	const view = render(Fixture, { mode: 'virtual', count: 50, axis: 'y' });
	await frames();
	expect(renderedOrder()).toEqual([1, 2, 3]);
	const p = await start(1);
	await move(p.x, p.y + 80);
	await release(p.x, p.y + 80);
	await expect.poll(() => view.component.read().values.slice(0, 5)).toEqual([0, 2, 1, 3, 4]);
	expect(
		view.component
			.read()
			.values.slice()
			.sort((a, b) => a - b)
	).toEqual(Array.from({ length: 50 }, (_, i) => i));
	expect(view.component.read().values.at(-1)).toBe(49);
});
it('reorder-contracts: native custom group/item refs and attributes remain usable', async () => {
	const view = render(Fixture, { custom: true });
	await frames();
	expect(view.component.read().group).toBe(node('group'));
	expect(node('group').tagName).toBe('ARTICLE');
	expect(item(0).tagName).toBe('MAIN');
	expect(view.component.read().firstRef).toBe(item(0));
	await userEvent.click(item(0));
	expect(view.component.read().selected).toBe(0);
	expect(item(0).getAttribute('draggable')).toBe('false');
});
it('reorder-gaps-row-ends: waits through a large gap then inserts after crossing', async () => {
	const view = render(Fixture, { layout: 'row', axis: 'xy', mode: 'gaps', count: 2 });
	await frames();
	const p = await start(0);
	let lastX = p.x;
	try {
		lastX = p.x + 99;
		await move(lastX, p.y);
		expect(view.component.read().values).toEqual([0, 1]);
		lastX = p.x + 101;
		await move(lastX, p.y);
		await expect.poll(() => view.component.read().values).toEqual([1, 0]);
	} finally {
		await release(lastX, p.y);
	}
	await expect.poll(() => new DOMMatrix(getComputedStyle(item(0)).transform).m41).toBeCloseTo(0, 1);
	expect(renderedOrder()).toEqual([1, 0]);
});
it.each(['wrap', 'wrap-rtl'])(
	'reorder-gaps-row-ends: %s inserts into an empty row end',
	async (layout) => {
		const view = render(Fixture, { layout, axis: 'xy', count: 3 });
		await frames();
		const p = await start(1);
		await move(p.x, p.y + 80);
		await expect.poll(() => view.component.read().values).toEqual([0, 2, 1]);
		// Hold while the displaced neighbor finishes changing rows. Replaying the
		// unchanged pointer must retain the chosen empty row-end insertion.
		await expect
			.poll(() => item(2).getBoundingClientRect().top)
			.toBeCloseTo(item(0).getBoundingClientRect().top, 1);
		await frames();
		expect(view.component.read().values).toEqual([0, 2, 1]);
		await release(p.x, p.y + 80);
		expect(renderedOrder()).toEqual([0, 2, 1]);
		await expect
			.poll(() => item(1).getBoundingClientRect().top - item(0).getBoundingClientRect().top)
			.toBeCloseTo(80, 1);
	}
);

it.each(['xy', undefined] as const)(
	'reorder-detected-layouts: grid axis=%s crosses both rows and columns',
	async (axis) => {
		const view = render(Fixture, { layout: 'grid', axis });
		await frames();
		const p = await start(0);
		await move(p.x + 100, p.y + 80);
		await expect.poll(() => view.component.read().values).toEqual([1, 2, 3, 0]);
		await release(p.x + 100, p.y + 80);
		expect(renderedOrder()).toEqual([1, 2, 3, 0]);
	}
);

it('reorder-detected-layouts: viewport resize replaces explicit y axis with x', async () => {
	const previous = { width: window.innerWidth, height: window.innerHeight };
	try {
		await page.viewport(900, 600);
		const view = render(Fixture, { mode: 'responsive', axis: 'y' });
		await frames();
		expect(view.component.read().axis).toBe('y');
		await page.viewport(500, 600);
		await expect.poll(() => view.component.read().axis).toBe('x');
		await expect
			.poll(() => item(1).getBoundingClientRect().left - item(0).getBoundingClientRect().left)
			.toBeCloseTo(100, 1);
		const p = await start(0);
		await move(p.x + 100, p.y);
		await release(p.x + 100, p.y);
		await expect.poll(() => view.component.read().values).toEqual([1, 0, 2, 3]);
		await view.unmount();
	} finally {
		await page.viewport(previous.width, previous.height);
	}
});
