import {
	animateMotionValue,
	cancelFrame,
	frame,
	isPrimaryPointer,
	isElementTextInput,
	setDragLock,
	time,
	type HTMLVisualElement,
	type SVGVisualElement,
	type PanInfo,
	type LayoutUpdateData
} from 'motion-dom';
import { cancelPointerPresses } from './press.js';
import { resolveElement, type ElementReference, type MotionPoint } from './coordinates.js';
import type { DragStartOptions } from './drag-controls.js';
import type {
	GestureElement,
	GestureOptions,
	GestureState,
	DragConstraints,
	DragConstraintSource,
	DragElastic
} from './gestures.js';
import { createGestureSession } from './gesture-session.js';
import { isComponentMotionVisual } from './animation.js';
type GestureVisual = HTMLVisualElement | SVGVisualElement;
type Axis = 'x' | 'y';
export type DragGestureCleanup = (() => void) & { update?: () => void };
const axes: Axis[] = ['x', 'y'];
const edges = { x: ['left', 'right'], y: ['top', 'bottom'] } as const;
const zero = (): MotionPoint => ({ x: 0, y: 0 });
const difference = (a: MotionPoint, b: MotionPoint): MotionPoint => ({
	x: a.x - b.x,
	y: a.y - b.y
});
const isElementSource = (
	source: DragConstraintSource | undefined
): source is ElementReference<GestureElement> =>
	!!source && (typeof source === 'function' || 'current' in source || 'nodeType' in source);

export function validateDragConstraints(constraints: DragConstraints | undefined): void {
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
}

/** Motion 13.4.4 uses .35; the component documentation's .5 default is stale. */
export function resolveDragElastic(value: DragElastic = 0.35): Required<DragConstraints> {
	const amount = value === true ? 0.35 : value === false ? 0 : value;
	const get = (key: keyof DragConstraints) => {
		const resolved = typeof amount === 'number' ? amount : (amount[key] ?? 0);
		if (!Number.isFinite(resolved) || resolved < 0 || resolved > 1) {
			throw new Error('Astra dragElastic must contain numbers between 0 and 1.');
		}
		return resolved;
	};
	return { left: get('left'), right: get('right'), top: get('top'), bottom: get('bottom') };
}

export function constrainDrag(
	value: number,
	min: number | undefined,
	max: number | undefined,
	elasticMin: number,
	elasticMax: number
): number {
	if (min !== undefined && value < min) return min + (value - min) * elasticMin;
	if (max !== undefined && value > max) return max + (value - max) * elasticMax;
	return value;
}

/** Pan and drag share the same engine state, pointer locks and press arbitration. */
export function attachDragGestures(
	node: GestureElement,
	getOptions: () => GestureOptions,
	setActive: (name: GestureState, active: boolean) => void,
	visual: GestureVisual
): DragGestureCleanup {
	const owner = createGestureSession(node, getOptions, setActive);
	const dispose: DragGestureCleanup = owner.dispose;
	const { initial, abort, cleanups, isDisposed, disabled, activate, defer, pagePoint, on } = owner;
	const view = node.ownerDocument.defaultView!;
	const transform = (point: MotionPoint) => getOptions().transformPagePoint?.(point) ?? point;
	if (!isElementSource(initial.dragConstraints) && initial.dragConstraints)
		validateDragConstraints(initial.dragConstraints);
	resolveDragElastic(initial.dragElastic);

	if (
		initial.drag ||
		initial.dragControls ||
		initial.onPan ||
		initial.onPanStart ||
		initial.onPanEnd ||
		initial.onPanSessionStart
	) {
		const originalDraggable = node.getAttribute('draggable');
		let assignedDraggable: string | null | undefined = originalDraggable;
		function ownStyle(
			property: 'touch-action' | 'user-select' | '-webkit-user-select',
			next: () => string
		) {
			const original = node.style.getPropertyValue(property);
			const computed = view.getComputedStyle(node).getPropertyValue(property);
			let assigned = original;
			// WebKit resolves its default prefixed `auto` selection policy to `text`.
			// An explicit inline declaration still takes ownership, even at that value.
			let owned =
				!original &&
				(!computed ||
					computed === 'auto' ||
					(property === '-webkit-user-select' && computed === 'text'));
			const stillOwned = () =>
				owned &&
				node.style.getPropertyValue(property) === assigned &&
				!node.style.getPropertyPriority(property);
			return {
				update() {
					if (!stillOwned()) {
						owned = false;
						return;
					}
					node.style.setProperty(property, getOptions().drag ? next() : original);
					assigned = node.style.getPropertyValue(property);
				},
				restore() {
					if (stillOwned()) node.style.setProperty(property, original);
				}
			};
		}
		const touchAction = ownStyle('touch-action', () =>
			getOptions().drag === 'x' ? 'pan-y' : getOptions().drag === 'y' ? 'pan-x' : 'none'
		);
		const userSelect = ownStyle(
			view.CSS?.supports('user-select', 'none') ? 'user-select' : '-webkit-user-select',
			() => 'none'
		);
		dispose.update = () => {
			if (isDisposed()) return;
			touchAction.update();
			userSelect.update();
			if (assignedDraggable === undefined) return;
			if (node.getAttribute('draggable') !== assignedDraggable) {
				assignedDraggable = undefined;
				return;
			}
			assignedDraggable = getOptions().drag ? 'false' : originalDraggable;
			if (assignedDraggable === null) node.removeAttribute('draggable');
			else node.setAttribute('draggable', assignedDraggable);
		};
		dispose.update();
		let session: { stop(): void; cancel(notify?: boolean): void } | undefined;
		let releaseGeneration = 0;
		const momentum = new Map<
			ReturnType<GestureVisual['getValue']>,
			ReturnType<GestureVisual['getValue']>['animation']
		>();
		let lastConstraints: DragConstraints | undefined;
		let constraintsElement: GestureElement | undefined;
		let resizeObserver: ResizeObserver | undefined;
		const observeConstraints = (element: GestureElement) => {
			if (typeof ResizeObserver === 'undefined') return;
			if (!resizeObserver) {
				let first = true;
				resizeObserver = new ResizeObserver(() => {
					if (first) first = false;
					else resize();
				});
				resizeObserver.observe(node);
			}
			if (constraintsElement !== element) {
				if (constraintsElement) resizeObserver.unobserve(constraintsElement);
				resizeObserver.observe(element);
			}
		};
		let cachedConstraints: DragConstraints | undefined;
		let cachedMeasure: GestureOptions['onMeasureDragConstraints'];
		let cachedTransform: GestureOptions['transformPagePoint'];
		const numericValue = (axis: Axis): number => {
			const value = visual.getValue(axis, 0).get();
			if (typeof value === 'number' && Number.isFinite(value)) return value;
			if (typeof value === 'string' && /^-?(?:\d*\.)?\d+%$/.test(value)) {
				const box = node.getBoundingClientRect();
				return (parseFloat(value) / 100) * (axis === 'x' ? box.width : box.height);
			}
			throw new Error('Motion drag requires finite numeric x/y values in CSS pixels.');
		};
		const readConstraints = (force = false): DragConstraints => {
			const options = getOptions();
			const source = options.dragConstraints;
			if (!source) return {};
			if (!isElementSource(source)) {
				validateDragConstraints(source);
				return { ...source };
			}
			const element = resolveElement(source);
			if (!element) throw new Error('Astra dragConstraints must resolve to a mounted element.');
			if (
				!force &&
				cachedConstraints &&
				constraintsElement === element &&
				cachedMeasure === options.onMeasureDragConstraints &&
				cachedTransform === options.transformPagePoint
			)
				return cachedConstraints;
			observeConstraints(element);
			constraintsElement = element;
			cachedMeasure = options.onMeasureDragConstraints;
			cachedTransform = options.transformPagePoint;
			const box = element.getBoundingClientRect();
			const target = node.getBoundingClientRect();
			const start = transform({ x: box.left + view.scrollX, y: box.top + view.scrollY });
			const end = transform({ x: box.right + view.scrollX, y: box.bottom + view.scrollY });
			const targetStart = transform({
				x: target.left + view.scrollX,
				y: target.top + view.scrollY
			});
			const targetEnd = transform({
				x: target.right + view.scrollX,
				y: target.bottom + view.scrollY
			});
			const layout = visual.projection?.layout?.layoutBox;
			let constraints: DragConstraints = {
				left: start.x - (layout?.x.min ?? targetStart.x - numericValue('x')),
				right: end.x - (layout?.x.max ?? targetEnd.x - numericValue('x')),
				top: start.y - (layout?.y.min ?? targetStart.y - numericValue('y')),
				bottom: end.y - (layout?.y.max ?? targetEnd.y - numericValue('y'))
			};
			if (constraints.left! > constraints.right!)
				[constraints.left, constraints.right] = [constraints.right, constraints.left];
			if (constraints.top! > constraints.bottom!)
				[constraints.top, constraints.bottom] = [constraints.bottom, constraints.top];
			constraints = getOptions().onMeasureDragConstraints?.({ ...constraints }) || constraints;
			validateDragConstraints(constraints);
			return (cachedConstraints = constraints);
		};
		const stopMomentum = () => {
			releaseGeneration++;
			for (const [value, animation] of momentum) if (value.animation === animation) value.stop();
			momentum.clear();
		};
		const startMomentum = (velocity: MotionPoint, dragAxes: Axis[]) => {
			if (
				disabled() ||
				visual.shouldSkipAnimations ||
				(visual.shouldReduceMotion && !isComponentMotionVisual(visual))
			)
				return;
			const generation = ++releaseGeneration;
			const options = getOptions();
			let constraints: DragConstraints;
			try {
				constraints = lastConstraints = readConstraints();
			} catch {
				return;
			}
			const animations = dragAxes.map((axis) => {
				const value = visual.getValue(axis, 0);
				const [minEdge, maxEdge] = edges[axis];
				const snap = options.dragSnapToOrigin === true || options.dragSnapToOrigin === axis;
				const min = snap ? 0 : constraints[minEdge];
				const max = snap ? 0 : constraints[maxEdge];
				const elastic = resolveDragElastic(options.dragElastic);
				const bounce = elastic[minEdge] !== 0 || elastic[maxEdge] !== 0;
				const modifyTarget = options.dragTransition?.modifyTarget;
				const transition = {
					type: 'inertia' as const,
					velocity: options.dragMomentum === false ? 0 : velocity[axis],
					bounceStiffness: bounce ? 200 : 1000000,
					bounceDamping: bounce ? 40 : 10000000,
					timeConstant: 750,
					restDelta: 1,
					restSpeed: 10,
					...options.dragTransition,
					...(!bounce && !snap
						? {
								modifyTarget: (target: number) =>
									Math.max(
										min ?? -Infinity,
										Math.min(max ?? Infinity, modifyTarget?.(target) ?? target)
									)
							}
						: {}),
					min,
					max,
					isSync: true
				};
				const promise = value.start(
					animateMotionValue(axis, value, [value.get(), value.get()], transition)
				);
				momentum.set(value, value.animation);
				return promise;
			});
			void Promise.all(animations).then(() => {
				if (!isDisposed() && generation === releaseGeneration) getOptions().onDragTransitionEnd?.();
			});
		};

		const start = (event: PointerEvent, startOptions: DragStartOptions = {}, manual = true) => {
			if (disabled() || session || !isPrimaryPointer(event) || event.button !== 0) return;
			const drag = getOptions().drag;
			if (manual && !drag) return;
			const dragAxes = (): Axis[] => {
				const current = getOptions().drag;
				return current === 'x' ? ['x'] : current === 'y' ? ['y'] : current ? axes : [];
			};
			const origin = zero();
			try {
				if (drag) {
					lastConstraints = readConstraints(true);
					resolveDragElastic(getOptions().dragElastic);
					for (const axis of axes) origin[axis] = numericValue(axis);
				}
			} catch (error) {
				if (isElementSource(getOptions().dragConstraints) || /numeric x\/y/.test(String(error)))
					throw error;
				return;
			}
			if (disabled()) return;
			stopMomentum();
			if (drag) for (const axis of axes) visual.getValue(axis, 0).stop();
			if (drag && startOptions.snapToCursor) {
				const cursor = transform(pagePoint(event));
				const rect = node.getBoundingClientRect();
				const center = transform({
					x: rect.left + rect.width / 2 + view.scrollX,
					y: rect.top + rect.height / 2 + view.scrollY
				});
				for (const axis of dragAxes()) {
					origin[axis] += cursor[axis] - center[axis];
					visual.getValue(axis, 0).set(origin[axis]);
				}
				visual.render();
			}
			let latest = event;
			let pendingMove = false;
			const initialPoint = transform(pagePoint(event));
			let previous = initialPoint;
			let started = false;
			let released = false;
			let direction: Axis | null = null;
			let releaseLock: (() => void) | null = null;
			const sessionAbort = new AbortController();
			const projection = visual.projection;
			const previouslyBlocked = projection?.isAnimationBlocked;
			const scrollOffset = zero();
			const history: { point: MotionPoint; timestamp: number }[] = [
				{ point: initialPoint, timestamp: time.now() }
			];
			let info: PanInfo = { point: initialPoint, delta: zero(), offset: zero(), velocity: zero() };
			const selectedAxes = () =>
				direction ? dragAxes().filter((axis) => axis === direction) : dragAxes();
			const process = () => {
				if (released) return;
				pendingMove = false;
				if (disabled() || (drag && !getOptions().drag)) {
					finish(latest, true, true);
					return;
				}
				let constraints: DragConstraints;
				let elastic: Required<DragConstraints>;
				try {
					if (drag) lastConstraints = readConstraints();
					elastic = resolveDragElastic(getOptions().dragElastic);
				} catch {
					finish(latest, true, true);
					return;
				}
				const current = transform({
					x: latest.clientX + view.scrollX,
					y: latest.clientY + view.scrollY
				});
				const timestamp = time.now();
				const offset = {
					x: current.x - initialPoint.x + scrollOffset.x,
					y: current.y - initialPoint.y + scrollOffset.y
				};
				const sample =
					history.find((sample) => timestamp - sample.timestamp <= 100) ?? history.at(-1)!;
				const duration = (timestamp - sample.timestamp) / 1000;
				info = {
					point: current,
					offset,
					delta: difference(current, previous),
					velocity:
						duration > 0
							? {
									x: (current.x - sample.point.x) / duration,
									y: (current.y - sample.point.y) / duration
								}
							: zero()
				};
				previous = current;
				if (history.length > 1 && timestamp - history[0].timestamp > 200) history.shift();
				history.push({ point: current, timestamp });
				if (!started) {
					if (Math.hypot(offset.x, offset.y) < (startOptions.distanceThreshold ?? 3)) return;
					if (drag && !getOptions().dragPropagation) {
						releaseLock = setDragLock(drag);
						if (!releaseLock) {
							finish(latest, true, false);
							return;
						}
					}
					started = true;
					if (drag) {
						if (projection) {
							projection.isAnimationBlocked = true;
							projection.target = undefined;
						}
						cancelPointerPresses(latest);
						activate('whileDrag', true);
						getOptions().onDragStart?.(latest, info);
						if (released) return;
					}
					getOptions().onPanStart?.(latest, info);
					if (released) return;
				}
				if (drag) {
					if (getOptions().dragDirectionLock && direction === null) {
						direction = Math.abs(offset.y) > 10 ? 'y' : Math.abs(offset.x) > 10 ? 'x' : null;
						if (direction) getOptions().onDirectionLock?.(direction);
						return;
					}
					try {
						constraints = lastConstraints = readConstraints();
					} catch {
						finish(latest, true, true);
						return;
					}
					if (released) return;
					for (const axis of selectedAxes()) {
						const [min, max] = edges[axis];
						visual
							.getValue(axis, 0)
							.set(
								constrainDrag(
									origin[axis] + offset[axis],
									constraints[min],
									constraints[max],
									elastic[min],
									elastic[max]
								)
							);
					}
					visual.render();
					getOptions().onDrag?.(latest, info);
					if (released) return;
				}
				getOptions().onPan?.(latest, info);
			};
			const releaseProjection = projection?.addEventListener(
				'didUpdate',
				({ delta, hasLayoutChanged }: LayoutUpdateData) => {
					if (!started || !drag || !hasLayoutChanged) return;
					for (const axis of dragAxes()) {
						origin[axis] += delta[axis].translate;
						const value = visual.getValue(axis, 0);
						value.set(Number(value.get()) + delta[axis].translate);
					}
					visual.render();
				}
			);
			const finish = (end: PointerEvent, cancelled: boolean, notify: boolean) => {
				if (released) return;
				released = true;
				cancelFrame(process);
				sessionAbort.abort();
				releaseProjection?.();
				if (projection && started && drag)
					projection.isAnimationBlocked = previouslyBlocked ?? false;
				releaseLock?.();
				if (node.hasPointerCapture(end.pointerId)) node.releasePointerCapture(end.pointerId);
				session = undefined;
				activate('whileDrag', false);
				if (drag && !cancelled && (started || getOptions().dragSnapToOrigin || lastConstraints))
					startMomentum(started ? info.velocity : zero(), selectedAxes());
				if (started && notify) {
					const finalInfo = info;
					defer(() => {
						getOptions().onPanEnd?.(end, finalInfo);
						if (drag && !isDisposed()) getOptions().onDragEnd?.(end, finalInfo);
						// User callbacks can invalidate constraints or disable the node.
						// Stop only inertia owned by this attachment in that case.
						try {
							if (disabled()) stopMomentum();
							else readConstraints();
						} catch {
							stopMomentum();
						}
					});
				}
			};
			session = {
				stop: () => finish(latest, false, true),
				cancel: (notify = false) => finish(latest, true, notify)
			};
			const listenerOptions = { signal: sessionAbort.signal, capture: true };
			view.addEventListener(
				'pointermove',
				(move) => {
					if (move.pointerId !== event.pointerId) return;
					latest = move;
					pendingMove = true;
					frame.update(process, true);
				},
				listenerOptions
			);
			view.addEventListener(
				'pointerup',
				(end) => {
					if (end.pointerId !== event.pointerId) return;
					latest = end;
					process();
					finish(end, false, true);
				},
				listenerOptions
			);
			view.addEventListener(
				'pointercancel',
				(end) => {
					if (end.pointerId !== event.pointerId) return;
					const normalRelease = isComponentMotionVisual(visual);
					// Upstream cancels from the last move, including a coalesced move
					// that has not reached the frame loop, rather than cancel coordinates.
					if (normalRelease && pendingMove) process();
					finish(end, !normalRelease, true);
				},
				listenerOptions
			);
			// Element blur is captured at window too. Focus moving to an external
			// drag handle must not look like the browser window losing focus.
			view.addEventListener('blur', () => finish(latest, true, true), {
				signal: sessionAbort.signal
			});
			// Motion's component sessions follow the pointer on window. Explicit
			// capture is lost when a keyed reorder moves the same connected node;
			// that event is not a release. Keep legacy binding capture semantics.
			if (!isComponentMotionVisual(visual)) {
				node.addEventListener(
					'lostpointercapture',
					(end) => {
						if ((end as PointerEvent).pointerId === event.pointerId) finish(latest, true, true);
					},
					listenerOptions
				);
			}
			const scrollPositions = new Map<Element, MotionPoint>();
			for (let parent = node.parentElement; parent; parent = parent.parentElement)
				scrollPositions.set(parent, { x: parent.scrollLeft, y: parent.scrollTop });
			view.addEventListener(
				'scroll',
				(scroll) => {
					const element = scroll.target as Element;
					const saved = scrollPositions.get(element);
					if (saved) {
						const current = { x: element.scrollLeft, y: element.scrollTop };
						const delta = difference(transform(current), transform(saved));
						scrollOffset.x += delta.x;
						scrollOffset.y += delta.y;
						scrollPositions.set(element, current);
					}
					frame.update(process, true);
				},
				listenerOptions
			);
			if (!isComponentMotionVisual(visual)) {
				try {
					node.setPointerCapture(event.pointerId);
				} catch {
					/* Synthetic pointers have no capture. */
				}
			}
			const startInfo = info;
			defer(() => getOptions().onPanSessionStart?.(event, startInfo), 'update');
		};
		on('pointerdown', (event) => {
			const options = getOptions();
			if (options.drag && options.dragListener === false) return;
			if (event.target !== node && isElementTextInput(event.target as Element)) return;
			start(event as PointerEvent, {}, false);
		});
		if (initial.dragControls)
			cleanups.push(
				initial.dragControls.subscribe({
					start,
					stop: () => session?.stop(),
					cancel: () => {
						session?.cancel();
						stopMomentum();
					}
				})
			);
		const resize = () => {
			if (isDisposed() || session || !isElementSource(getOptions().dragConstraints)) return;
			const before = lastConstraints;
			let next: DragConstraints;
			try {
				next = readConstraints(true);
			} catch {
				return;
			}
			lastConstraints = next;
			if (!before) return;
			stopMomentum();
			for (const axis of axes) {
				const value = visual.getValue(axis, 0);
				const current = Number(value.get());
				const [min, max] = edges[axis];
				if (
					!current ||
					before[min] === undefined ||
					before[max] === undefined ||
					next[min] === undefined ||
					next[max] === undefined
				)
					continue;
				const length = before[max]! - before[min]!;
				const progress = length ? Math.max(0, Math.min(1, (current - before[min]!) / length)) : 0.5;
				value.set(next[min]! + progress * (next[max]! - next[min]!));
			}
			visual.render();
		};
		view.addEventListener('resize', resize, { signal: abort.signal });
		const measure = () => {
			if (isDisposed() || !isElementSource(getOptions().dragConstraints)) return;
			try {
				lastConstraints = readConstraints(true);
			} catch {
				return;
			}
		};
		const stopMeasure = visual.projection?.addEventListener('measure', measure);
		frame.read(measure);
		cleanups.push(() => {
			session?.cancel();
			stopMomentum();
			cancelFrame(measure);
			stopMeasure?.();
			resizeObserver?.disconnect();
			touchAction.restore();
			userSelect.restore();
			if (assignedDraggable !== undefined && node.getAttribute('draggable') === assignedDraggable) {
				if (originalDraggable === null) node.removeAttribute('draggable');
				else node.setAttribute('draggable', originalDraggable);
			}
		});
	}

	return dispose;
}
