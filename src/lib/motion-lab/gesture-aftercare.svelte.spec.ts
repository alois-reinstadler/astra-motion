import { afterEach, expect, it, vi } from 'vitest';
import { HTMLProjectionNode, HTMLVisualElement, isDragActive } from 'motion-dom';
import { attachMotionGestures, type GestureOptions } from '../motion/gestures.js';

const cleanups: (() => void)[] = [];
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) cleanup();
	vi.restoreAllMocks();
});

function fixture(options: GestureOptions) {
	const node = document.createElement('button');
	node.textContent = 'Gesture regression';
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
	const states = new Map<string, boolean>();
	let stop = attachMotionGestures(
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
	return {
		node,
		visual,
		states,
		options,
		rebind() {
			stop();
			stop = attachMotionGestures(
				node,
				() => options,
				(name, active) => states.set(name, active),
				visual
			);
		},
		stop: () => stop()
	};
}
function key(node: HTMLElement, name = 'Enter') {
	node.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
	node.dispatchEvent(new KeyboardEvent('keyup', { key: name, bubbles: true }));
}
function pointer(target: EventTarget, type: string, x = 0, id = 1) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId: id,
			isPrimary: true,
			pointerType: 'mouse',
			button: 0,
			clientX: x,
			clientY: 0
		})
	);
}

it('keeps Enter working after reattachment while focus stays on the same button', () => {
	let taps = 0;
	const f = fixture({ onTap: () => taps++ });
	f.node.focus();
	key(f.node);
	f.rebind();
	expect(document.activeElement).toBe(f.node);
	key(f.node);
	expect(taps).toBe(2);
});

it('does not retain disposed focus callbacks or accumulate keyboard handlers per press', () => {
	let taps = 0;
	const f = fixture({ onTap: () => taps++ });
	const add = vi.spyOn(f.node, 'addEventListener');
	for (let i = 0; i < 20; i++) f.rebind();
	const afterRebind = add.mock.calls.length;
	f.node.focus();
	for (let i = 0; i < 30; i++) key(f.node);
	expect(taps).toBe(30);
	expect(add.mock.calls).toHaveLength(afterRebind);
	f.stop();
	const afterStop = add.mock.calls.length;
	f.node.blur();
	f.node.focus();
	key(f.node);
	expect(add.mock.calls).toHaveLength(afterStop);
	expect(taps).toBe(30);
});

it('keeps Space feedback separate from native click and ignores other pointers', () => {
	let taps = 0;
	let clicks = 0;
	const f = fixture({ whileTap: { scale: 0.9 }, onTap: () => taps++ });
	f.node.onclick = () => clicks++;
	f.node.focus();
	f.node.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
	expect(f.states.get('whileTap')).toBe(true);
	f.node.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
	expect(f.states.get('whileTap')).toBe(false);
	expect(taps).toBe(0);
	expect(clicks).toBe(0);
	pointer(f.node, 'pointerdown', 0, 5);
	pointer(f.node, 'pointerup', 0, 6);
	expect(f.states.get('whileTap')).toBe(true);
	pointer(f.node, 'pointerup', 0, 5);
	expect(taps).toBe(1);
	expect(f.states.get('whileTap')).toBe(false);
	f.node.click();
	expect(clicks).toBe(1);
	expect(taps).toBe(1);
});

it('ignores invalid live bounds before pointerdown and accepts a later valid session', () => {
	const f = fixture({ drag: 'x', dragMomentum: false, dragConstraints: { left: 0, right: 100 } });
	f.options.dragConstraints = { left: NaN, right: 100 };
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 30);
	expect(f.visual.getValue('x', 0).get()).toBe(0);
	expect(isDragActive()).toBe(false);
	f.options.dragConstraints = { left: 0, right: 100 };
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 30);
	expect(f.visual.getValue('x', 0).get()).toBe(30);
	expect(isDragActive()).toBe(false);
});

it('cancels invalid mid-drag bounds without a poisoned pose, drag lock or momentum', async () => {
	const f = fixture({ drag: 'x', dragConstraints: { left: 0, right: 100 } });
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointermove', 30);
	await nextFrame();
	expect(isDragActive()).toBe(true);
	const lastPose = f.visual.getValue('x', 0).get();
	f.options.dragConstraints = { left: 90, right: 10 };
	pointer(window, 'pointermove', 60);
	await nextFrame();
	expect(isDragActive()).toBe(false);
	expect(f.states.get('whileDrag')).toBe(false);
	expect(f.visual.getValue('x', 0).get()).toBe(lastPose);
	expect(f.visual.getValue('x', 0).isAnimating()).toBe(false);
	f.options.dragConstraints = { left: 0, right: 100 };
	f.options.dragMomentum = false;
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 10);
	expect(f.visual.getValue('x', 0).get()).toBe(Number(lastPose) + 10);
	expect(isDragActive()).toBe(false);
});

it('revalidates constraints changed by drag callbacks before pose and momentum writes', () => {
	const f = fixture({ drag: 'x', dragConstraints: { left: 0, right: 100 } });
	f.options.onDragStart = () => {
		f.options.dragConstraints = { left: NaN };
	};
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 30);
	expect(f.visual.getValue('x', 0).get()).toBe(0);
	expect(isDragActive()).toBe(false);
	f.options.onDragStart = undefined;
	f.options.dragConstraints = { left: 0, right: 100 };
	f.options.onDragEnd = () => {
		f.options.dragConstraints = { right: NaN };
	};
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 30);
	expect(f.visual.getValue('x', 0).get()).toBe(30);
	expect(f.visual.getValue('x', 0).isAnimating()).toBe(false);
	expect(isDragActive()).toBe(false);
});

it('cancels pointer feedback on window blur and accepts the next press', () => {
	let taps = 0;
	let cancellations = 0;
	const f = fixture({
		whileTap: { scale: 0.9 },
		onTap: () => taps++,
		onTapCancel: (event) => {
			expect(event.type).toBe('pointercancel');
			cancellations++;
		}
	});
	pointer(f.node, 'pointerdown');
	expect(f.states.get('whileTap')).toBe(true);
	window.dispatchEvent(new Event('blur'));
	expect(f.states.get('whileTap')).toBe(false);
	expect(cancellations).toBe(1);
	pointer(f.node, 'pointerdown');
	pointer(f.node, 'pointerup');
	expect(taps).toBe(1);
	f.stop();
	window.dispatchEvent(new Event('blur'));
	expect(cancellations).toBe(1);
});

it('restores projection and stops writing when onDragStart disposes the binding', () => {
	const f = fixture({ drag: 'x' });
	const projection = new HTMLProjectionNode({});
	f.visual.projection = projection;
	let callbacksAfterStop = 0;
	f.options.onDragStart = () => f.stop();
	f.options.onDrag = () => callbacksAfterStop++;
	f.options.onPanStart = () => callbacksAfterStop++;
	f.options.onPan = () => callbacksAfterStop++;
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 30);
	expect(projection.isAnimationBlocked).toBe(false);
	expect(isDragActive()).toBe(false);
	expect(f.visual.getValue('x', 0).get()).toBe(0);
	expect(callbacksAfterStop).toBe(0);
	expect(f.states.get('whileDrag')).toBe(false);
	f.visual.projection = undefined;
});

it('does not call drag end or start inertia after onPanEnd disposes the binding', () => {
	const f = fixture({ drag: 'x' });
	let dragEnds = 0;
	f.options.onPanEnd = () => f.stop();
	f.options.onDragEnd = () => dragEnds++;
	pointer(f.node, 'pointerdown');
	pointer(window, 'pointerup', 30);
	expect(dragEnds).toBe(0);
	expect(isDragActive()).toBe(false);
	expect(f.visual.getValue('x', 0).isAnimating()).toBe(false);
});
