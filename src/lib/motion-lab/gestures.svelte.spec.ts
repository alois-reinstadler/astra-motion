import { afterEach, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { HTMLVisualElement, isDragActive } from 'motion-dom';
import {
	attachMotionGestures,
	type GestureOptions,
	type GestureState
} from '../motion/gestures.js';
import {
	motionStore,
	motionValue,
	mapValue,
	springValue,
	transformValue
} from '../motion/values.js';
import { get } from 'svelte/store';
import { prepareMotionHandoff } from '../motion/motion-compat.js';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const cleanups: (() => void)[] = [];
afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function fixture(options: GestureOptions = {}, tag: 'button' | 'div' = 'button') {
	const node = document.createElement(tag);
	node.style.cssText = 'width:80px;height:50px;background:coral';
	document.body.append(node);
	const visual = new HTMLVisualElement({
		props: {},
		presenceContext: null,
		visualState: {
			latestValues: { x: 0, y: 0 },
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	const states = new Map<GestureState, boolean>();
	const stop = attachMotionGestures(
		node,
		() => options,
		(name, active) => states.set(name, active),
		visual
	);
	cleanups.push(() => {
		stop();
		visual.unmount();
		node.remove();
	});
	return { node, visual, states, stop, options };
}
function pointer(node: EventTarget, type: string, x = 0, y = 0, id = 1) {
	node.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId: id,
			isPrimary: true,
			pointerType: 'mouse',
			button: 0,
			clientX: x,
			clientY: y
		})
	);
}

it('bridges MotionValues to Svelte subscriptions without destroying the supplied value', () => {
	const value = motionValue(2);
	const store = motionStore(value);
	const seen: number[] = [];
	const stop = store.subscribe((next) => seen.push(next));
	store.update((next) => next + 1);
	value.set(5);
	expect(seen).toEqual([2, 3, 5]);
	stop();
	value.set(8);
	expect(seen).toEqual([2, 3, 5]);
	expect(get(store)).toBe(8);
	value.destroy();
});

it('reuses Motion derived values and springs through the Svelte store bridge', async () => {
	const source = motionValue(0);
	const mapped = mapValue(source, [0, 10], [0, 100]);
	const doubled = transformValue(() => source.get() * 2);
	const spring = springValue(source, { stiffness: 500, damping: 40 });
	const mappedStore = motionStore(mapped);
	const doubledStore = motionStore(doubled);
	const springStore = motionStore(spring);
	const stops = [
		mappedStore.subscribe(() => {}),
		doubledStore.subscribe(() => {}),
		springStore.subscribe(() => {})
	];
	try {
		source.set(5);
		for (let i = 0; i < 8; i++) await nextFrame();
		expect(get(mappedStore)).toBe(50);
		expect(get(doubledStore)).toBe(10);
		expect(get(springStore)).toBeGreaterThan(0);
		expect(get(springStore)).toBeLessThanOrEqual(5.01);
	} finally {
		stops.forEach((stop) => stop());
		source.destroy();
		mapped.destroy();
		doubled.destroy();
		spring.destroy();
	}
});

it('preserves a spring follower through native handoff checks and retargeting', async () => {
	const source = motionValue(0);
	const spring = springValue(source, { stiffness: 500, damping: 40 });
	try {
		source.set(100);
		await expect.poll(() => spring.isAnimating()).toBe(true);
		const follower = spring.animation;
		expect(follower).toBeDefined();
		expect(follower && 'complete' in follower).toBe(false);
		expect(prepareMotionHandoff(follower)).toBe(false);
		expect(spring.isAnimating()).toBe(true);
		source.set(-20);
		await expect.poll(() => spring.get()).toBeCloseTo(-20, 2);
		await expect.poll(() => spring.isAnimating()).toBe(false);
	} finally {
		spring.destroy();
		source.destroy();
	}
});

it('filters touch hover, supports pointer tap cancellation, and clears states on cleanup', () => {
	let taps = 0;
	let cancels = 0;
	const f = fixture({
		whileHover: { scale: 1.1 },
		whileTap: { scale: 0.9 },
		onTap: () => taps++,
		onTapCancel: () => cancels++
	});
	f.node.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
	expect(f.states.get('whileHover')).not.toBe(true);
	pointer(f.node, 'pointerenter');
	expect(f.states.get('whileHover')).toBe(true);
	pointer(f.node, 'pointerdown');
	expect(f.states.get('whileTap')).toBe(true);
	pointer(f.node, 'pointercancel');
	expect(f.states.get('whileTap')).toBe(false);
	expect(cancels).toBe(1);
	pointer(f.node, 'pointerdown');
	pointer(f.node, 'pointerup');
	expect(taps).toBe(1);
	f.stop();
	expect(f.states.get('whileHover')).toBe(false);
	pointer(f.node, 'pointerdown');
	expect(f.states.get('whileTap')).toBe(false);
});

it('supports keyboard press, restores generated tabindex, and suppresses disabled interaction', () => {
	let taps = 0;
	const f = fixture({ whileTap: { scale: 0.9 }, onTap: () => taps++ }, 'div');
	expect(f.node.tabIndex).toBe(0);
	f.node.focus();
	f.node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
	expect(f.states.get('whileTap')).toBe(true);
	f.node.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
	expect(f.states.get('whileTap')).toBe(false);
	expect(taps).toBe(1);
	f.node.setAttribute('aria-disabled', 'true');
	pointer(f.node, 'pointerdown');
	pointer(f.node, 'pointerup');
	expect(taps).toBe(1);
	f.stop();
	expect(f.node.hasAttribute('tabindex')).toBe(false);
});

it('tracks real intersection entry and leave and disconnects on teardown', async () => {
	let entries = 0;
	let leaves = 0;
	const f = fixture({
		whileInView: { opacity: 1 },
		onViewportEnter: () => entries++,
		onViewportLeave: () => leaves++
	});
	await expect.poll(() => entries).toBe(1);
	f.node.style.position = 'fixed';
	f.node.style.top = '-1000px';
	await expect.poll(() => leaves).toBe(1);
	expect(f.states.get('whileInView')).toBe(false);
	f.stop();
	f.node.style.top = '0px';
	for (let i = 0; i < 3; i++) await nextFrame();
	expect(entries).toBe(1);
});

it('drags through the existing VisualElement, clamps numeric bounds, ignores other pointers, and releases the global drag lock', async () => {
	let starts = 0;
	let ends = 0;
	const f = fixture({
		drag: 'x',
		dragConstraints: { left: -20, right: 60 },
		dragMomentum: false,
		onDragStart: () => starts++,
		onDragEnd: () => ends++
	});
	pointer(f.node, 'pointerdown', 0, 0);
	pointer(window, 'pointermove', 30, 0, 2);
	await nextFrame();
	expect(f.visual.getValue('x', 0).get()).toBe(0);
	pointer(window, 'pointermove', 100, 20);
	await nextFrame();
	await nextFrame();
	expect(f.visual.getValue('x', 0).get()).toBe(60);
	expect(f.visual.getValue('y', 0).get()).toBe(0);
	expect(f.states.get('whileDrag')).toBe(true);
	expect(isDragActive()).toBe(true);
	pointer(window, 'pointerup', 100, 20);
	expect(starts).toBe(1);
	expect(ends).toBe(1);
	expect(isDragActive()).toBe(false);
	expect(f.states.get('whileDrag')).toBe(false);
});

it('cancels an active drag on destruction and restores touch-action', async () => {
	const f = fixture({ drag: true });
	expect(f.node.style.touchAction).toBe('none');
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointermove', 20, 20);
	await nextFrame();
	expect(isDragActive()).toBe(true);
	f.stop();
	expect(isDragActive()).toBe(false);
	expect(f.node.style.touchAction).toBe('');
	const x = f.visual.getValue('x', 0).get();
	pointer(window, 'pointermove', 80, 80);
	pointer(window, 'pointerup', 80, 80);
	await nextFrame();
	expect(f.visual.getValue('x', 0).get()).toBe(x);
});

it('hands release velocity to Motion inertia and cancels it on a new drag', async () => {
	const f = fixture({
		drag: 'x',
		dragConstraints: { left: 0, right: 500 },
		dragTransition: { timeConstant: 150 }
	});
	pointer(f.node, 'pointerdown', 0, 0);
	await nextFrame();
	pointer(window, 'pointermove', 20, 0);
	await nextFrame();
	await nextFrame();
	pointer(window, 'pointermove', 50, 0);
	await nextFrame();
	pointer(window, 'pointerup', 50, 0);
	const released = Number(f.visual.getValue('x', 0).get());
	await nextFrame();
	await nextFrame();
	await nextFrame();
	expect(Number(f.visual.getValue('x', 0).get())).toBeGreaterThan(released);
	pointer(f.node, 'pointerdown', 50, 0);
	const stopped = f.visual.getValue('x', 0).get();
	await nextFrame();
	await nextFrame();
	expect(f.visual.getValue('x', 0).get()).toBe(stopped);
	pointer(window, 'pointercancel', 50, 0);
});

it('uses native focus-visible matching and clears focus on blur', () => {
	const f = fixture({ whileFocus: { scale: 1.1 } });
	f.node.focus();
	expect(f.states.get('whileFocus') ?? false).toBe(f.node.matches(':focus-visible'));
	f.node.blur();
	expect(f.states.get('whileFocus') ?? false).toBe(false);
});

it('provides pan callbacks without changing element transforms', async () => {
	let sessions = 0;
	let pans = 0;
	let ends = 0;
	const f = fixture({
		onPanSessionStart: () => sessions++,
		onPan: () => pans++,
		onPanEnd: () => ends++
	});
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointermove', 50, 10);
	await nextFrame();
	expect(sessions).toBe(1);
	expect(pans).toBeGreaterThan(0);
	expect(f.visual.getValue('x', 0).get()).toBe(0);
	expect(isDragActive()).toBe(false);
	pointer(window, 'pointerup', 50, 10);
	expect(ends).toBe(1);
});

it('cancels a drag on pointer cancellation without starting inertia', async () => {
	const f = fixture({ drag: 'x' });
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointermove', 50, 0);
	await nextFrame();
	pointer(window, 'pointercancel', 50, 0);
	const x = f.visual.getValue('x', 0).get();
	await nextFrame();
	await nextFrame();
	expect(f.visual.getValue('x', 0).get()).toBe(x);
	expect(isDragActive()).toBe(false);
});

it('honors reduced motion by stopping at the released drag position', async () => {
	const f = fixture({ drag: 'x' });
	f.visual.shouldReduceMotion = true;
	pointer(f.node, 'pointerdown');
	await nextFrame();
	pointer(window, 'pointermove', 50, 0);
	await nextFrame();
	pointer(window, 'pointerup', 50, 0);
	await nextFrame();
	await nextFrame();
	expect(f.visual.getValue('x', 0).get()).toBe(50);
	expect(f.visual.getValue('x', 0).isAnimating()).toBe(false);
});

it('keeps release inertia within numeric bounds', async () => {
	const f = fixture({
		drag: 'x',
		dragConstraints: { left: 0, right: 60 },
		dragTransition: { timeConstant: 70 }
	});
	pointer(f.node, 'pointerdown');
	await nextFrame();
	pointer(window, 'pointermove', 40, 0);
	await nextFrame();
	pointer(window, 'pointerup', 40, 0);
	for (let i = 0; i < 16; i++) {
		await nextFrame();
		expect(Number(f.visual.getValue('x', 0).get())).toBeLessThanOrEqual(60);
		expect(Number(f.visual.getValue('x', 0).get())).toBeGreaterThanOrEqual(40);
	}
});

it('rejects invalid drag constraints before registering listeners', () => {
	const node = document.createElement('div');
	const visual = new HTMLVisualElement({
		props: {},
		presenceContext: null,
		visualState: {
			latestValues: {},
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	expect(() =>
		attachMotionGestures(
			node,
			() => ({ drag: 'x', dragConstraints: { left: 20, right: 0 } }),
			() => {},
			visual
		)
	).toThrow('left <= right');
	expect(() =>
		attachMotionGestures(
			node,
			() => ({ drag: 'x', dragConstraints: { right: NaN } }),
			() => {},
			visual
		)
	).toThrow('finite numbers');
});

it('captures a real browser pointer throughout dragging and releases it at the end', async () => {
	let captured = false;
	let ended = false;
	const f = fixture({
		drag: 'x',
		dragMomentum: false,
		onDragStart: (event) => {
			captured = event instanceof PointerEvent && f.node.hasPointerCapture(event.pointerId);
		},
		onDragEnd: () => {
			ended = true;
		}
	});
	const destination = document.createElement('div');
	destination.style.cssText =
		'position:fixed;left:300px;top:100px;width:80px;height:50px;background:blue';
	document.body.append(destination);
	cleanups.push(() => destination.remove());
	await userEvent.dragAndDrop(f.node, destination);
	expect(captured).toBe(true);
	expect(ended).toBe(true);
	expect(Number(f.visual.getValue('x', 0).get())).toBeGreaterThan(100);
	expect(isDragActive()).toBe(false);
});
