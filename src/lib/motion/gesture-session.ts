import { cancelFrame, frame } from 'motion-dom';
import type { GestureElement, GestureOptions, GestureState } from './gestures.js';
import type { MotionPoint } from './coordinates.js';

/** Shared event/frame ownership; it imports no animation, drag or layout runtime. */
export function createGestureSession(
	node: GestureElement,
	getOptions: () => GestureOptions,
	setActive: (name: GestureState, active: boolean) => void
) {
	const abort = new AbortController();
	const cleanups: (() => void)[] = [];
	const active = new Set<GestureState>();
	const pending = new Set<() => void>();
	let disposed = false;
	return {
		abort,
		cleanups,
		active,
		initial: getOptions(),
		isDisposed: () => disposed,
		disabled: () =>
			disposed ||
			getOptions().disabled ||
			node.matches(':disabled') ||
			!!node.closest('[inert], [aria-disabled="true"]'),
		activate(name: GestureState, value: boolean) {
			if (active.has(name) === value) return;
			if (value) active.add(name);
			else active.delete(name);
			setActive(name, value);
		},
		defer(callback: () => void, phase: 'update' | 'postRender' = 'postRender') {
			const run = () => {
				pending.delete(run);
				if (!disposed) callback();
			};
			pending.add(run);
			frame[phase](run, false, true);
		},
		pagePoint: (event: PointerEvent): MotionPoint => ({ x: event.pageX, y: event.pageY }),
		on: (type: string, listener: EventListener) =>
			node.addEventListener(type, listener, { signal: abort.signal }),
		dispose() {
			if (disposed) return;
			disposed = true;
			abort.abort();
			for (const callback of pending) cancelFrame(callback);
			pending.clear();
			for (const cleanup of cleanups) cleanup();
			for (const name of active) setActive(name, false);
			active.clear();
		}
	};
}
