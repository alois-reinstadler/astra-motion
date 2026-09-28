import { afterEach, describe, expect, it } from 'vitest';
import { HTMLVisualElement, isDragActive } from 'motion-dom';
import { attachMotionGestures, type GestureOptions } from '../motion/gestures.js';
import { useDragControls } from '../motion/drag-controls.js';
import { correctParentTransform, transformViewBoxPoint } from '../motion/coordinates.js';

const cleanups: (() => void)[] = [];
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});
function fixture(options: GestureOptions, parent: HTMLElement = document.body) {
	const node = document.createElement('div');
	node.style.cssText = 'position:relative;width:50px;height:50px;background:teal;';
	parent.append(node);
	const visual = new HTMLVisualElement({
		props: {},
		presenceContext: null,
		visualState: {
			latestValues: { x: 0, y: 0 },
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	const states = new Map<string, boolean>();
	const stop = attachMotionGestures(
		node,
		() => options,
		(key, active) => states.set(key, active),
		visual
	);
	cleanups.push(() => {
		stop();
		visual.unmount();
		node.remove();
	});
	return { node, visual, states, stop, options };
}
function pointer(target: EventTarget, type: string, x: number, y = 0, pointerId = 1) {
	const event = new PointerEvent(type, {
		bubbles: true,
		isPrimary: true,
		pointerType: 'mouse',
		pointerId,
		button: 0,
		clientX: x,
		clientY: y
	});
	target.dispatchEvent(event);
	return event;
}

describe('complete drag sessions', () => {
	it('keeps an external-handle session through native focus transfer but cancels on window blur', async () => {
		const previous = document.createElement('button');
		const handle = document.createElement('button');
		document.body.append(previous, handle);
		cleanups.push(() => {
			previous.remove();
			handle.remove();
		});
		const controls = useDragControls();
		let ends = 0;
		const f = fixture({
			drag: 'x',
			dragListener: false,
			dragControls: controls,
			dragMomentum: false,
			onDragEnd: () => ends++
		});
		previous.focus();
		expect(document.activeElement).toBe(previous);
		controls.start(pointer(handle, 'pointerdown', 0));
		// This is native focus/blur dispatch, in the order of a trusted handle click.
		handle.focus();
		expect(document.activeElement).toBe(handle);
		pointer(window, 'pointermove', 40);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(40);
		window.dispatchEvent(new Event('blur'));
		await expect.poll(() => ends).toBe(1);
		pointer(window, 'pointermove', 80);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(40);
		expect(isDragActive()).toBe(false);
	});
	it('starts from an external handle, honors its threshold, and separates stop from cancel', async () => {
		const controls = useDragControls();
		let ends = 0;
		const f = fixture({
			drag: 'x',
			dragListener: false,
			dragControls: controls,
			dragMomentum: false,
			onDragEnd: () => ends++
		});
		pointer(f.node, 'pointerdown', 0);
		pointer(window, 'pointermove', 40);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(0);
		controls.start(new PointerEvent('pointerdown', { isPrimary: true, pointerId: 1, button: 0 }), {
			distanceThreshold: 10
		});
		pointer(window, 'pointermove', 8);
		await nextFrame();
		expect(isDragActive()).toBe(false);
		pointer(window, 'pointermove', 20);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(20);
		controls.cancel();
		await nextFrame();
		expect(ends).toBe(0);
		expect(isDragActive()).toBe(false);
		controls.start(new PointerEvent('pointerdown', { isPrimary: true, pointerId: 2, button: 0 }));
		pointer(window, 'pointermove', 25, 0, 2);
		await nextFrame();
		controls.stop();
		await expect.poll(() => ends).toBe(1);
		expect(isDragActive()).toBe(false);
	});
	it('uses .35 elasticity by default and returns into bounds with momentum disabled', async () => {
		const f = fixture({ drag: 'x', dragConstraints: { left: 0, right: 100 }, dragMomentum: false });
		pointer(f.node, 'pointerdown', 0);
		pointer(window, 'pointermove', 120);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(107);
		pointer(window, 'pointerup', 120);
		await expect
			.poll(() => Number(f.visual.getValue('x', 0).get()), { timeout: 3000 })
			.toBeCloseTo(100, 1);
	});
	it('keeps the distinct direction-lock threshold and reports direction once', async () => {
		const locked: string[] = [];
		const f = fixture({
			drag: true,
			dragMomentum: false,
			dragDirectionLock: true,
			onDirectionLock: (axis) => locked.push(axis)
		});
		pointer(f.node, 'pointerdown', 0, 0);
		pointer(window, 'pointermove', 7, 6);
		await nextFrame();
		expect(f.states.get('whileDrag')).toBe(true);
		expect(f.visual.getValue('x', 0).get()).toBe(0);
		pointer(window, 'pointermove', 30, 12);
		await nextFrame();
		await nextFrame();
		expect(locked).toEqual(['y']);
		expect(f.visual.getValue('x', 0).get()).toBe(0);
		expect(f.visual.getValue('y', 0).get()).toBe(12);
		pointer(window, 'pointercancel', 30, 12);
	});
	it('cancels nested tap feedback when its draggable parent claims the pointer', async () => {
		let cancels = 0;
		const parent = fixture({ drag: true, dragMomentum: false });
		const child = fixture({ whileTap: { scale: 0.9 }, onTapCancel: () => cancels++ }, parent.node);
		pointer(child.node, 'pointerdown', 0);
		expect(child.states.get('whileTap')).toBe(true);
		pointer(window, 'pointermove', 20);
		await expect.poll(() => cancels).toBe(1);
		expect(child.states.get('whileTap')).toBe(false);
		pointer(window, 'pointerup', 20);
		await nextFrame();
		expect(cancels).toBe(1);
	});
	it('stops only tap propagation while preserving native pointer events', async () => {
		let outer = 0;
		let inner = 0;
		let native = 0;
		const parent = fixture({ onTapStart: () => outer++ });
		const child = fixture({ onTapStart: () => inner++, propagate: { tap: false } }, parent.node);
		parent.node.addEventListener('pointerdown', () => native++);
		pointer(child.node, 'pointerdown', 0);
		pointer(child.node, 'pointerup', 0);
		await expect.poll(() => inner).toBe(1);
		expect(outer).toBe(0);
		expect(native).toBe(1);
	});
	it('measures a getter constraint and preserves relative position when it resizes', async () => {
		const container = document.createElement('div');
		container.style.cssText = 'position:fixed;left:50px;top:50px;width:250px;height:150px;';
		document.body.append(container);
		cleanups.push(() => container.remove());
		const f = fixture(
			{ drag: 'x', dragConstraints: () => container, dragElastic: false, dragMomentum: false },
			container
		);
		await nextFrame();
		await nextFrame();
		pointer(f.node, 'pointerdown', 50, 60);
		pointer(window, 'pointermove', 350, 60);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(200);
		pointer(window, 'pointerup', 350, 60);
		container.style.width = '150px';
		await expect.poll(() => f.visual.getValue('x', 0).get()).toBe(100);
	});
	it('observes replacement getter constraints for later size changes', async () => {
		const first = document.createElement('div');
		const second = document.createElement('div');
		for (const container of [first, second]) {
			container.style.cssText = 'position:fixed;left:50px;top:50px;width:250px;height:150px;';
			document.body.append(container);
			cleanups.push(() => container.remove());
		}
		let current = first;
		const f = fixture(
			{ drag: 'x', dragConstraints: () => current, dragElastic: false, dragMomentum: false },
			first
		);
		await nextFrame();
		await nextFrame();
		current = second;
		second.append(f.node);
		pointer(f.node, 'pointerdown', 50, 60);
		pointer(window, 'pointermove', 350, 60);
		await nextFrame();
		expect(f.visual.getValue('x', 0).get()).toBe(200);
		pointer(window, 'pointerup', 350, 60);
		await nextFrame();
		second.style.width = '150px';
		await expect.poll(() => Number(f.visual.getValue('x', 0).get())).toBe(100);
	});
	it('compensates ancestor scroll during a stationary pointer and removes its frame work', async () => {
		const container = document.createElement('div');
		container.style.cssText = 'width:200px;height:100px;overflow:auto;';
		const body = document.createElement('div');
		body.style.height = '500px';
		container.append(body);
		document.body.append(container);
		cleanups.push(() => container.remove());
		let moves = 0;
		const f = fixture({ drag: 'y', dragMomentum: false, onDrag: () => moves++ }, body);
		pointer(f.node, 'pointerdown', 0, 0);
		pointer(window, 'pointermove', 0, 20);
		await nextFrame();
		expect(f.visual.getValue('y', 0).get()).toBe(20);
		container.scrollTop = 40;
		expect(container.scrollTop).toBeGreaterThan(0);
		// Browsers may quantize the assigned scroll offset to a fractional CSS pixel.
		await expect.poll(() => Number(f.visual.getValue('y', 0).get()) - container.scrollTop).toBe(20);
		f.stop();
		const stopped = moves;
		container.scrollTop = 70;
		await nextFrame();
		await nextFrame();
		expect(moves).toBe(stopped);
		expect(isDragActive()).toBe(false);
	});
	it('corrects transformed parent axes and SVG viewBox origin/letterboxing', () => {
		const parent = document.createElement('div');
		parent.style.cssText = 'position:fixed;left:100px;top:100px;width:100px;height:100px;scale:2;';
		document.body.append(parent);
		cleanups.push(() => parent.remove());
		const correct = correctParentTransform(() => parent);
		const a = correct({ x: 100, y: 100 });
		const b = correct({ x: 120, y: 140 });
		expect(b.x - a.x).toBeCloseTo(10);
		expect(b.y - a.y).toBeCloseTo(20);
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('viewBox', '40 20 100 50');
		svg.setAttribute('width', '200');
		svg.setAttribute('height', '200');
		document.body.append(svg);
		cleanups.push(() => svg.remove());
		const screen = new DOMPoint(90, 45).matrixTransform(svg.getScreenCTM()!);
		const point = transformViewBoxPoint(() => svg)({
			x: screen.x + window.scrollX,
			y: screen.y + window.scrollY
		});
		expect(point.x).toBeCloseTo(90);
		expect(point.y).toBeCloseTo(45);
	});
});
