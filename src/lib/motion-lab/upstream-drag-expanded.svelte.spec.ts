// Motion 13.4.4 @ 33f6e72; adaptations and MIT attribution: tests/motion-baseline.
import { tick } from 'svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamDragExpanded.svelte';
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const frames = async () => {
	await tick();
	await frame();
	await frame();
};
const node = (id = 'target') => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
let activePointer: { x: number; y: number } | undefined;
function pointer(target: EventTarget, type: string, x = 10, y = 10) {
	if (type === 'pointerdown' || (type === 'pointermove' && activePointer)) {
		activePointer = { x, y };
	} else if (type === 'pointerup' || type === 'pointercancel') {
		activePointer = undefined;
	}
	const e = new PointerEvent(type, {
		bubbles: true,
		isPrimary: true,
		pointerType: 'mouse',
		pointerId: 1,
		button: 0,
		clientX: x,
		clientY: y
	});
	target.dispatchEvent(e);
	return e;
}
afterEach(async () => {
	if (activePointer) {
		pointer(window, 'pointerup', activePointer.x, activePointer.y);
		await frames();
	}
	vi.restoreAllMocks();
});
async function move(x: number, y = 10) {
	pointer(window, 'pointermove', x, y);
	await frames();
}

it.each(['stop-up', 'reset-value', 'normal'])(
	'drag-callback-lifecycle: %s ends once with current transformed point',
	async (mode) => {
		const report = vi.fn();
		const view = render(Fixture, {
			mode,
			options: { drag: 'x', transformPagePoint: (p) => ({ x: p.x * 2, y: p.y * 2 }) },
			report
		});
		await frames();
		pointer(node(), 'pointerdown');
		await move(40);
		expect(report.mock.calls.map(([name]) => name)).toContain('old:session');
		view.component.updateCallbacks();
		await frames();
		await move(60);
		pointer(node('child'), 'pointerup', 60);
		await frames();
		const calls = report.mock.calls;
		expect(calls.filter(([name]) => name === 'new:end')).toHaveLength(1);
		expect(calls.some(([name]) => name === 'new:move')).toBe(true);
		expect(calls.find(([name]) => name === 'new:end')?.[1].point).toEqual(
			calls.filter(([name]) => name.endsWith(':move')).at(-1)?.[1].point
		);
		expect(view.component.read().x).toBe(mode === 'reset-value' ? 0 : 100);
	}
);
it('drag-callback-lifecycle: no movement means no drag end', async () => {
	const report = vi.fn();
	render(Fixture, { report });
	await frames();
	pointer(node(), 'pointerdown');
	pointer(node(), 'pointerup');
	await frames();
	expect(report.mock.calls.map(([name]) => name)).not.toContain('old:end');
	expect(report.mock.calls.map(([name]) => name)).not.toContain('old:start');
});
it('drag-release-transition: configured spring settles inside constraints before one completion callback', async () => {
	const report = vi.fn();
	const view = render(Fixture, {
		report,
		options: {
			drag: 'x',
			dragConstraints: { left: 0, right: 40 },
			dragElastic: 0.5,
			dragTransition: { bounceStiffness: 700, bounceDamping: 45 }
		}
	});
	await frames();
	pointer(node(), 'pointerdown');
	await move(130);
	expect(view.component.read().x).toBe(80);
	pointer(window, 'pointerup', 130);
	await expect.poll(() => view.component.read().x).toBeCloseTo(40, 1);
	await expect.poll(() => report.mock.calls.filter(([name]) => name === 'settled').length).toBe(1);
	expect(report.mock.calls.findIndex(([name]) => name === 'old:end')).toBeLessThan(
		report.mock.calls.findIndex(([name]) => name === 'settled')
	);
});
it.each(['x', 'y'] as const)(
	'drag-direction-and-bounds: locks initial %s direction',
	async (axis) => {
		const view = render(Fixture, { options: { dragDirectionLock: true } });
		await frames();
		pointer(node(), 'pointerdown');
		await move(axis === 'x' ? 50 : 10, axis === 'y' ? 50 : 10);
		await move(90, 90);
		expect(view.component.read()[axis]).toBeGreaterThan(0);
		expect(view.component.read()[axis === 'x' ? 'y' : 'x']).toBe(0);
	}
);
it.each(['x', 'y', true] as const)(
	'drag-direction-and-bounds: %s clamps both corners and uses replacement bounds',
	async (drag) => {
		const view = render(Fixture, {
			options: {
				drag,
				dragElastic: false,
				dragConstraints: { left: -20, right: 30, top: -40, bottom: 50 }
			}
		});
		await frames();
		pointer(node(), 'pointerdown');
		await move(200, 200);
		expect(view.component.read().x).toBe(drag === 'y' ? 0 : 30);
		expect(view.component.read().y).toBe(drag === 'x' ? 0 : 50);
		await move(-200, -200);
		expect(view.component.read().x).toBe(drag === 'y' ? 0 : -20);
		expect(view.component.read().y).toBe(drag === 'x' ? 0 : -40);
		pointer(window, 'pointerup', -200, -200);
		await frames();
		view.component.configure({ dragConstraints: { left: -10, right: 15, top: -10, bottom: 15 } });
		await frames();
		pointer(node(), 'pointerdown');
		await move(300, 300);
		expect(view.component.read().x).toBe(drag === 'y' ? 0 : 15);
		expect(view.component.read().y).toBe(drag === 'x' ? 0 : 15);
	}
);
it('drag-nested-release: blocked parent receives no momentum before or after its own drag', async () => {
	const view = render(Fixture, { mode: 'nested' });
	await frames();
	pointer(node(), 'pointerdown');
	await move(50);
	pointer(window, 'pointerup', 50);
	await frames();
	expect(view.component.read().parentX).toBe(0);
	pointer(node('parent'), 'pointerdown');
	await move(40);
	pointer(window, 'pointerup', 40);
	await frames();
	// Catch parent inertia before beginning the next child session.
	pointer(node('parent'), 'pointerdown', 40);
	pointer(window, 'pointerup', 40);
	await frames();
	const parent = view.component.read().parentX;
	expect(parent).toBeGreaterThan(0);
	pointer(node(), 'pointerdown');
	await move(70);
	pointer(window, 'pointerup', 70);
	await frames();
	expect(view.component.read().parentX).toBeCloseTo(parent, 1);
	expect(view.component.read().x).toBeGreaterThan(40);
});
it('drag-active-variant: actual whileDrag opacity activates and restores', async () => {
	render(Fixture, { options: { whileDrag: { opacity: 0.8 } } });
	await frames();
	expect(getComputedStyle(node()).opacity).toBe('0.2');
	pointer(node(), 'pointerdown');
	await move(50);
	await expect.poll(() => getComputedStyle(node()).opacity).toBe('0.8');
	pointer(window, 'pointerup', 50);
	await expect.poll(() => getComputedStyle(node()).opacity).toBe('0.2');
});
it('drag-replace-value: replacement style MotionValue receives subsequent drag writes', async () => {
	const view = render(Fixture, { options: { drag: 'x' } });
	await frames();
	view.component.replaceValue();
	await frames();
	expect(view.component.read().x).toBe(25);
	pointer(node(), 'pointerdown');
	await move(50);
	expect(view.component.read().x).toBe(65);
	expect(view.component.read().oldX).toBe(0);
	expect(new DOMMatrix(getComputedStyle(node()).transform).m41).toBe(65);
});
it.each(['div', 'button', 'input', 'a'] as const)(
	'drag-native-targets: native %s can itself drag',
	async (tag) => {
		const view = render(Fixture, { tag, options: { drag: 'x' } });
		await frames();
		pointer(node(), 'pointerdown');
		await move(50);
		expect(view.component.read().x).toBe(40);
	}
);
it.each(['input', 'textarea', 'select', 'checkbox', 'editable', 'child', 'link', 'plain'])(
	'drag-native-targets: filters descendant %s appropriately',
	async (id) => {
		const report = vi.fn();
		const view = render(Fixture, { mode: 'inputs', report, options: { drag: 'x' } });
		await frames();
		pointer(node(id), 'pointerdown');
		await move(70);
		pointer(window, 'pointerup', 70);
		await frames();
		const allowed = ['child', 'link', 'plain'].includes(id);
		expect(view.component.read().x).toBe(allowed ? 60 : 0);
		expect(report.mock.calls.filter(([name]) => name === 'old:start')).toHaveLength(
			allowed ? 1 : 0
		);
	}
);
it('drag-presence-initial: presence initial=false uses animate as first drag origin', async () => {
	const view = render(Fixture, { mode: 'presence-initial', options: { drag: 'y' } });
	await frames();
	expect(view.component.read().y).toBe(0);
	pointer(node(), 'pointerdown');
	await move(10, 40);
	expect(view.component.read().y).toBe(30);
});
it('drag-controls-replace: parent handle starts child once and replaced controls detach', async () => {
	const report = vi.fn();
	const view = render(Fixture, {
		mode: 'parent-handle',
		options: { drag: 'x', dragListener: false },
		report
	});
	await frames();
	pointer(node('parent'), 'pointerdown');
	await move(40);
	pointer(window, 'pointerup', 40);
	await frames();
	expect(view.component.read().x).toBe(30);
	expect(report.mock.calls.filter(([name]) => name === 'old:start')).toHaveLength(1);
	view.component.replaceControls();
	await frames();
	const event = new PointerEvent('pointerdown', {
		pointerId: 1,
		isPrimary: true,
		button: 0,
		clientX: 10,
		clientY: 10
	});
	view.component.start(event, 'old');
	await move(80);
	expect(view.component.read().x).toBe(30);
	pointer(window, 'pointerup', 80);
	view.component.start(event, 'new');
	await move(50);
	expect(view.component.read().x).toBe(70);
});
it('drag-snap-initial: repeated snap to same cursor is independent of initial offset', async () => {
	const view = render(Fixture, { initialX: 100, initialY: 100, options: { dragListener: false } });
	await frames();
	expect(view.component.read().x).toBe(100);
	const event = () =>
		new PointerEvent('pointerdown', {
			pointerId: 1,
			isPrimary: true,
			button: 0,
			clientX: 200,
			clientY: 180
		});
	view.component.start(event(), 'old', true);
	await frames();
	const first = view.component.read();
	pointer(window, 'pointerup', 200, 180);
	await frames();
	view.component.start(event(), 'old', true);
	await frames();
	expect(view.component.read().x).toBeCloseTo(first.x, 1);
	expect(view.component.read().y).toBeCloseTo(first.y, 1);
	const rect = node().getBoundingClientRect();
	expect(rect.left + rect.width / 2).toBeCloseTo(200, 1);
	expect(rect.top + rect.height / 2).toBeCloseTo(180, 1);
});
it.each([
	[-70, 10, -50, 0],
	[130, 10, 70, 0],
	[10, -70, 0, -50],
	[10, 130, 0, 70]
])('drag-elastic-number: pointer %s,%s applies .5 elasticity', async (px, py, x, y) => {
	const view = render(Fixture, {
		options: { dragConstraints: { left: -20, right: 20, top: -20, bottom: 20 }, dragElastic: 0.5 }
	});
	await frames();
	pointer(node(), 'pointerdown');
	await move(px, py);
	expect(view.component.read().x).toBe(x);
	expect(view.component.read().y).toBe(y);
	pointer(window, 'pointerup', px, py);
	await expect.poll(() => view.component.read().x).toBeCloseTo(Math.max(-20, Math.min(20, x)), 1);
	await expect.poll(() => view.component.read().y).toBeCloseTo(Math.max(-20, Math.min(20, y)), 1);
});
it('drag-held-flick: a held pointer still produces momentum and catch-release stops it', async () => {
	let releasePending = false;
	let resolveRelease!: (position: number) => void;
	const released = new Promise<number>((resolve) => {
		resolveRelease = resolve;
	});
	const view = render(Fixture, {
		options: { drag: 'x', dragMomentum: true, dragTransition: { timeConstant: 100 } },
		report: (name, info) => {
			if (name !== 'old:move' || info?.point.x !== 100 || releasePending) return;
			releasePending = true;
			// Release the quick flick after its public drag callback. Waiting extra
			// frames here can turn it into a stationary hold with zero velocity.
			queueMicrotask(() => {
				const position = view.component.read().x;
				pointer(window, 'pointerup', 100);
				resolveRelease(position);
			});
		}
	});
	await frames();
	pointer(node(), 'pointerdown');
	for (let i = 0; i < 9; i++) await frame();
	await move(40);
	pointer(window, 'pointermove', 100);
	const release = await released;
	expect(release).toBe(90);
	await expect.poll(() => view.component.read().x).toBeGreaterThan(release);
	pointer(node(), 'pointerdown', 100);
	const caught = view.component.read().x;
	pointer(window, 'pointerup', 100);
	await frames();
	expect(view.component.read().x).toBeCloseTo(caught, 1);
});
it.each([true, 'x', 'y'] as const)(
	'drag-snap-axes: snap=%s restores selected axes only',
	async (snap) => {
		const view = render(Fixture, { options: { dragSnapToOrigin: snap } });
		await frames();
		pointer(node(), 'pointerdown');
		await move(70, 50);
		expect(view.component.read().x).toBe(60);
		expect(view.component.read().y).toBe(40);
		pointer(window, 'pointerup', 70, 50);
		await expect.poll(() => view.component.read().x).toBeCloseTo(snap === 'y' ? 60 : 0, 1);
		await expect.poll(() => view.component.read().y).toBeCloseTo(snap === 'x' ? 40 : 0, 1);
	}
);
it.each(['click', 'drag'] as const)(
	'drag-release-interruption: interrupt returning bounds with %s',
	async (mode) => {
		const view = render(Fixture, {
			options: {
				drag: 'x',
				dragConstraints: { left: 0, right: 40 },
				dragElastic: 0.5,
				dragTransition: { bounceStiffness: 80, bounceDamping: 15 }
			}
		});
		await frames();
		pointer(node(), 'pointerdown');
		await move(210);
		pointer(window, 'pointerup', 210);
		expect(view.component.read().x).toBeGreaterThan(40);
		await frame();
		pointer(node(), 'pointerdown', 210);
		const caught = view.component.read().x;
		if (mode === 'drag') {
			await move(230);
			expect(Math.abs(view.component.read().x - caught)).toBeLessThan(30);
		}
		pointer(window, 'pointerup', mode === 'drag' ? 230 : 210);
		await expect.poll(() => view.component.read().x, { timeout: 3000 }).toBeCloseTo(40, 1);
	}
);

// Upstream PanSession ends with release coordinates without another onMove callback.
it.each([
	{ coalesced: false, releaseX: 40 },
	{ coalesced: false, releaseX: 70 },
	{ coalesced: true, releaseX: 70 }
])(
	'drag-callback-lifecycle: coalesced=$coalesced release=$releaseX preserves final info without an extra drag update',
	async ({ coalesced, releaseX }) => {
		const report = vi.fn();
		const view = render(Fixture, {
			report,
			options: { drag: 'x', transformPagePoint: (point) => ({ x: point.x * 2, y: point.y * 2 }) }
		});
		await frames();
		pointer(node(), 'pointerdown', 10, 10);
		pointer(window, 'pointermove', 40, 10);
		if (!coalesced) {
			await frames();
			expect(view.component.read().x).toBe(60);
			report.mockClear();
		}
		pointer(window, 'pointerup', releaseX, 10);
		await frames();
		expect(view.component.read().x).toBe(60);
		expect(report.mock.calls.filter(([name]) => name === 'old:move')).toHaveLength(
			coalesced ? 1 : 0
		);
		const endings = report.mock.calls.filter(([name]) => name === 'old:end');
		expect(endings).toHaveLength(1);
		expect(endings[0][1].point).toEqual({ x: releaseX * 2, y: 20 });
	}
);
