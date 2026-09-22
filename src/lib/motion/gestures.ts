import {
	animateMotionValue,
	cancelFrame,
	frame,
	hover,
	isPrimaryPointer,
	motionValue,
	setDragLock,
	type HTMLVisualElement,
	type InertiaOptions,
	type LayoutUpdateData,
	type MotionNodeDragHandlers,
	type MotionNodeFocusHandlers,
	type MotionNodeHoverHandlers,
	type MotionNodePanHandlers,
	type MotionNodeTapHandlers,
	type MotionNodeViewportOptions,
	type PanInfo
} from 'motion-dom';
import { attachPress } from './press.js';

export type GestureState = 'whileHover' | 'whileTap' | 'whileFocus' | 'whileInView' | 'whileDrag';

/** Numeric translation bounds in CSS pixels, relative to the element's layout position. */
export interface DragConstraints {
	left?: number;
	right?: number;
	top?: number;
	bottom?: number;
}

export interface GestureOptions
	extends
		MotionNodeHoverHandlers,
		Omit<MotionNodeTapHandlers, 'globalTapTarget'>,
		MotionNodeFocusHandlers,
		MotionNodeViewportOptions,
		MotionNodePanHandlers,
		Pick<MotionNodeDragHandlers, 'onDragStart' | 'onDrag' | 'onDragEnd'> {
	disabled?: boolean;
	whileDrag?: MotionNodeHoverHandlers['whileHover'];
	drag?: boolean | 'x' | 'y';
	dragConstraints?: DragConstraints;
	dragMomentum?: boolean;
	dragTransition?: InertiaOptions;
}

const validateConstraints = (constraints: DragConstraints | undefined) => {
	if (!constraints) return;
	if (Object.values(constraints).some((value) => value !== undefined && !Number.isFinite(value))) {
		throw new Error('Motion drag constraints must contain finite numbers.');
	}
	if (
		(constraints.left ?? -Infinity) > (constraints.right ?? Infinity) ||
		(constraints.top ?? -Infinity) > (constraints.bottom ?? Infinity)
	) {
		throw new Error('Motion drag constraints must have left <= right and top <= bottom.');
	}
};

const point = (event: PointerEvent) => ({ x: event.clientX, y: event.clientY });

/**
 * Gesture recognition only: Motion's animation state remains the target/value
 * owner. Viewport configuration and gesture availability are captured on attach;
 * reattach when those change. Targets and callbacks are read live.
 *
 * Drag intentionally supports numeric x/y constraints, not transformed coordinate
 * systems, reference-element constraints, elastic overshoot or drag controls.
 * Motion owns value tracking, frame scheduling and release inertia.
 */
export function attachMotionGestures(
	node: HTMLElement,
	getOptions: () => GestureOptions,
	setActive: (name: GestureState, active: boolean) => void,
	visual: HTMLVisualElement
): () => void {
	const abort = new AbortController();
	const cleanups: (() => void)[] = [];
	const initial = getOptions();
	validateConstraints(initial.dragConstraints);
	const active = new Set<GestureState>();
	let disposed = false;
	const disabled = () =>
		disposed ||
		getOptions().disabled ||
		node.matches(':disabled') ||
		!!node.closest('[inert], [aria-disabled="true"]');
	const activate = (name: GestureState, value: boolean) => {
		if (active.has(name) === value) return;
		if (value) active.add(name);
		else active.delete(name);
		setActive(name, value);
	};
	const on = <K extends keyof HTMLElementEventMap>(
		type: K,
		listener: (event: HTMLElementEventMap[K]) => void
	) => node.addEventListener(type, listener, { signal: abort.signal });

	if (initial.whileHover || initial.onHoverStart || initial.onHoverEnd) {
		cleanups.push(
			hover(node, (_, event) => {
				if (disabled()) return;
				activate('whileHover', true);
				getOptions().onHoverStart?.(event, { point: point(event) });
				return (end) => {
					activate('whileHover', false);
					if (!disabled()) getOptions().onHoverEnd?.(end, { point: point(end) });
				};
			})
		);
	}

	if (initial.whileTap || initial.onTap || initial.onTapStart || initial.onTapCancel) {
		const originalTabIndex = node.getAttribute('tabindex');
		cleanups.push(
			attachPress(node, (_, event) => {
				if (disabled()) return;
				activate('whileTap', true);
				getOptions().onTapStart?.(event, { point: point(event) });
				return (end, { success }) => {
					if (!active.has('whileTap')) return;
					activate('whileTap', false);
					if (disabled()) return;
					const callback = success ? getOptions().onTap : getOptions().onTapCancel;
					callback?.(end, { point: point(end) });
				};
			})
		);
		cleanups.push(() => {
			if (originalTabIndex === null && node.getAttribute('tabindex') === '0') {
				node.removeAttribute('tabindex');
			}
		});
		// The owned press helper supplies Enter. Space mirrors native button
		// press feedback without synthesising click or changing activation behavior.
		on('keydown', (event) => {
			if (event.key === ' ' && !event.repeat && !disabled()) activate('whileTap', true);
		});
		on('keyup', (event) => {
			if (event.key === ' ') activate('whileTap', false);
		});
		on('blur', () => activate('whileTap', false));
	}

	if (initial.whileFocus) {
		on('focus', () => {
			if (!disabled() && node.matches(':focus-visible')) activate('whileFocus', true);
		});
		on('blur', () => activate('whileFocus', false));
	}

	if (initial.whileInView || initial.onViewportEnter || initial.onViewportLeave) {
		const viewport = initial.viewport;
		const threshold =
			viewport?.amount === 'all' ? 1 : typeof viewport?.amount === 'number' ? viewport.amount : 0;
		const observer = new IntersectionObserver(
			(entries) => {
				if (disposed) return;
				for (const entry of entries) {
					const visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
					if (disabled() || active.has('whileInView') === visible) continue;
					activate('whileInView', visible);
					if (visible) getOptions().onViewportEnter?.(entry);
					else getOptions().onViewportLeave?.(entry);
					if (visible && viewport?.once) observer.disconnect();
				}
			},
			{ root: viewport?.root?.current, rootMargin: viewport?.margin, threshold }
		);
		observer.observe(node);
		cleanups.push(() => observer.disconnect());
	}

	if (
		initial.drag ||
		initial.onPan ||
		initial.onPanStart ||
		initial.onPanEnd ||
		initial.onPanSessionStart
	) {
		const originalTouchAction = node.style.touchAction;
		if (initial.drag && !originalTouchAction) {
			node.style.touchAction =
				initial.drag === 'x' ? 'pan-y' : initial.drag === 'y' ? 'pan-x' : 'none';
		}
		const assignedTouchAction = node.style.touchAction;
		let cancelSession: (() => void) | undefined;
		const momentum = new Map<
			ReturnType<typeof visual.getValue>,
			ReturnType<typeof visual.getValue>['animation']
		>();
		on('pointerdown', (event) => {
			if (disabled() || cancelSession || !isPrimaryPointer(event) || event.button !== 0) return;
			const options = getOptions();
			const drag = options.drag;
			try {
				validateConstraints(options.dragConstraints);
			} catch {
				// Reject transient invalid bounds before allocating or stopping values.
				return;
			}
			const axes = (drag === 'x' ? ['x'] : drag === 'y' ? ['y'] : ['x', 'y']) as ('x' | 'y')[];
			const pointer = { x: motionValue(event.clientX), y: motionValue(event.clientY) };
			const origin = { x: 0, y: 0 };
			if (drag) {
				for (const axis of axes) {
					const value = visual.getValue(axis, 0);
					if (typeof value.get() !== 'number' || !Number.isFinite(value.get())) {
						pointer.x.destroy();
						pointer.y.destroy();
						throw new Error('Motion drag requires finite numeric x/y values in CSS pixels.');
					}
					value.stop();
					origin[axis] = Number(value.get());
				}
			}
			let latest = event;
			let previous = point(event);
			let started = false;
			let released = false;
			let releaseLock: (() => void) | null = null;
			const sessionAbort = new AbortController();
			const projection = visual.projection;
			const previouslyBlocked = projection?.isAnimationBlocked;
			let info: PanInfo = {
				point: previous,
				delta: { x: 0, y: 0 },
				offset: { x: 0, y: 0 },
				velocity: { x: 0, y: 0 }
			};
			const bounds = (axis: 'x' | 'y', constraints: DragConstraints | undefined) => {
				return axis === 'x'
					? { min: constraints?.left, max: constraints?.right }
					: { min: constraints?.top, max: constraints?.bottom };
			};
			const process = () => {
				if (released) return;
				if (disabled()) {
					finish(latest, true);
					return;
				}
				try {
					validateConstraints(getOptions().dragConstraints);
				} catch {
					// A reactive constraint can become temporarily invalid mid-drag.
					// Keep the last finite pose and release every session resource.
					finish(latest, true);
					return;
				}
				const current = point(latest);
				const offset = { x: current.x - event.clientX, y: current.y - event.clientY };
				if (pointer.x.get() !== current.x) pointer.x.set(current.x);
				if (pointer.y.get() !== current.y) pointer.y.set(current.y);
				info = {
					point: current,
					offset,
					delta: { x: current.x - previous.x, y: current.y - previous.y },
					velocity: { x: pointer.x.getVelocity(), y: pointer.y.getVelocity() }
				};
				previous = current;
				if (!started) {
					if (Math.hypot(offset.x, offset.y) < 3) return;
					if (drag) {
						releaseLock = setDragLock(drag);
						if (!releaseLock) {
							finish(latest, true);
							return;
						}
					}
					// User callbacks may synchronously destroy this attachment.
					// Cleanup must see the active session before any callback runs.
					started = true;
					if (drag) {
						if (projection) projection.isAnimationBlocked = true;
						activate('whileTap', false);
						if (released) return;
						activate('whileDrag', true);
						if (released) return;
						getOptions().onDragStart?.(latest, info);
						if (released) return;
					}
					getOptions().onPanStart?.(latest, info);
					if (released) return;
				}
				if (drag) {
					const constraints = { ...getOptions().dragConstraints };
					try {
						validateConstraints(constraints);
					} catch {
						finish(latest, true);
						return;
					}
					for (const axis of axes) {
						const { min = -Infinity, max = Infinity } = bounds(axis, constraints);
						visual.getValue(axis, 0).set(Math.max(min, Math.min(max, origin[axis] + offset[axis])));
					}
					getOptions().onDrag?.(latest, info);
					if (released) return;
				}
				getOptions().onPan?.(latest, info);
			};
			const releaseProjection = projection?.addEventListener(
				'didUpdate',
				({ delta }: LayoutUpdateData) => {
					if (!started || !drag) return;
					for (const axis of axes) origin[axis] += delta[axis].translate;
				}
			);
			const finish = (end: PointerEvent, cancelled: boolean) => {
				if (released) return;
				released = true;
				cancelFrame(process);
				sessionAbort.abort();
				releaseProjection?.();
				if (projection && started && drag)
					projection.isAnimationBlocked = previouslyBlocked ?? false;
				releaseLock?.();
				if (node.hasPointerCapture(end.pointerId)) node.releasePointerCapture(end.pointerId);
				cancelSession = undefined;
				activate('whileDrag', false);
				if (started && !disposed) {
					getOptions().onPanEnd?.(end, info);
					if (drag && !disposed) getOptions().onDragEnd?.(end, info);
				}
				const constraints = { ...getOptions().dragConstraints };
				let validConstraints = true;
				try {
					validateConstraints(constraints);
				} catch {
					validConstraints = false;
				}
				if (
					validConstraints &&
					drag &&
					started &&
					!cancelled &&
					!disabled() &&
					!visual.shouldReduceMotion &&
					!visual.shouldSkipAnimations &&
					getOptions().dragMomentum !== false
				) {
					for (const axis of axes) {
						const value = visual.getValue(axis, 0);
						const transition = getOptions().dragTransition;
						const { min = -Infinity, max = Infinity } = bounds(axis, constraints);
						// Explicit resolved endpoints avoid AsyncMotionValueAnimation's equal-keyframe
						// short circuit; Motion's inertia generator derives its own destination.
						const release = {
							...transition,
							type: 'inertia' as const,
							isSync: true,
							velocity: pointer[axis].getVelocity(),
							...bounds(axis, constraints),
							modifyTarget: (target: number) =>
								Math.max(min, Math.min(max, transition?.modifyTarget?.(target) ?? target))
						};
						void value.start(animateMotionValue(axis, value, [value.get(), value.get()], release));
						momentum.set(value, value.animation);
					}
				}
				pointer.x.destroy();
				pointer.y.destroy();
			};
			cancelSession = () => finish(latest, true);
			const sessionOptions = { signal: sessionAbort.signal, capture: true };
			window.addEventListener(
				'pointermove',
				(move) => {
					if (move.pointerId !== event.pointerId) return;
					latest = move;
					frame.update(process);
				},
				sessionOptions
			);
			window.addEventListener(
				'pointerup',
				(end) => {
					if (end.pointerId !== event.pointerId) return;
					latest = end;
					if (end.clientX !== previous.x || end.clientY !== previous.y) process();
					finish(end, false);
				},
				sessionOptions
			);
			window.addEventListener(
				'pointercancel',
				(end) => {
					if (end.pointerId === event.pointerId) finish(end, true);
				},
				sessionOptions
			);
			window.addEventListener('blur', () => finish(latest, true), sessionOptions);
			node.addEventListener('lostpointercapture', () => finish(latest, true), sessionOptions);
			try {
				node.setPointerCapture(event.pointerId);
			} catch {
				/* Synthetic events have no active pointer. */
			}
			getOptions().onPanSessionStart?.(event, { point: point(event) });
		});
		cleanups.push(() => {
			cancelSession?.();
			for (const [value, animation] of momentum) {
				if (value.animation === animation) value.stop();
			}
			if (node.style.touchAction === assignedTouchAction)
				node.style.touchAction = originalTouchAction;
		});
	}

	return () => {
		if (disposed) return;
		disposed = true;
		abort.abort();
		for (const cleanup of cleanups) cleanup();
		for (const name of active) setActive(name, false);
		active.clear();
	};
}
