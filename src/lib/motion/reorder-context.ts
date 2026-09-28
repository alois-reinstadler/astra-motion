import { getContext, setContext } from 'svelte';
import type { MotionPoint } from './coordinates.js';

export type ReorderAxis = 'x' | 'y' | 'xy';
export interface ReorderBox {
	x: { min: number; max: number };
	y: { min: number; max: number };
}
export interface ReorderEntry<T> {
	value: T;
	layout: ReorderBox;
}
const separated = (a: ReorderBox['x'], b: ReorderBox['x']) => a.max <= b.min || b.max <= a.min;

export function detectReorderAxis(boxes: ReorderBox[]): ReorderAxis {
	let x = false;
	let y = false;
	for (let i = 0; i < boxes.length; i++)
		for (let j = i + 1; j < boxes.length; j++) {
			x ||= separated(boxes[i].x, boxes[j].x);
			y ||= separated(boxes[i].y, boxes[j].y);
			if (x && y) return 'xy';
		}
	return x ? 'x' : 'y';
}
const middle = (axis: ReorderBox['x']) => (axis.min + axis.max) / 2;
const distance = (value: number, min: number, max: number) => Math.max(min - value, 0, value - max);

/** Pure geometry contract: preserve value identity and move only measured entries. */
export function reorderValues<T>(
	order: ReorderEntry<T>[],
	value: T,
	offset: MotionPoint,
	velocity: MotionPoint,
	axis: ReorderAxis,
	rtl = false
): ReorderEntry<T>[] {
	const from = order.findIndex((entry) => entry.value === value);
	if (from === -1) return order;
	let to = from;
	const box = order[from].layout;
	if (axis !== 'xy') {
		if (!velocity[axis]) return order;
		const direction = velocity[axis] > 0 ? 1 : -1;
		const next = order[from + direction];
		if (!next) return order;
		if (
			direction > 0
				? box[axis].max + offset[axis] > middle(next.layout[axis])
				: box[axis].min + offset[axis] < middle(next.layout[axis])
		)
			to = from + direction;
	} else {
		const center = { x: middle(box.x) + offset.x, y: middle(box.y) + offset.y };
		const lines: { min: number; max: number; items: ReorderEntry<T>[] }[] = [];
		for (const entry of order) {
			const { min, max } = entry.layout.y;
			const last = lines.at(-1);
			if (!last || min >= last.max || max <= last.min) lines.push({ min, max, items: [entry] });
			else {
				last.min = Math.min(last.min, min);
				last.max = Math.max(last.max, max);
				last.items.push(entry);
			}
		}
		const source = lines.find((line) => line.items.includes(order[from]));
		const target = lines.reduce((best, line) =>
			distance(center.y, line.min, line.max) < distance(center.y, best.min, best.max) ? line : best
		);
		if (target !== source) {
			const remaining = order.filter((_, index) => index !== from);
			const before = target.items.find((entry) =>
				rtl ? center.x > middle(entry.layout.x) : center.x < middle(entry.layout.x)
			);
			to = before ? remaining.indexOf(before) : remaining.indexOf(target.items.at(-1)!) + 1;
		} else {
			const boxDistance = (candidate: ReorderBox) =>
				distance(center.x, candidate.x.min, candidate.x.max) ** 2 +
				distance(center.y, candidate.y.min, candidate.y.max) ** 2;
			let nearest = boxDistance(box);
			let targetIndex = from;
			order.forEach((entry, index) => {
				const next = boxDistance(entry.layout);
				if (next < nearest) {
					nearest = next;
					targetIndex = index;
				}
			});
			to = from + Math.sign(targetIndex - from);
		}
	}
	if (to === from) return order;
	const result = order.slice();
	result.splice(from, 1);
	result.splice(to, 0, order[from]);
	return result;
}

export interface ReorderContext<T> {
	readonly axis: ReorderAxis;
	register(value: T, layout: ReorderBox): void;
	unregister(value: T): void;
	update(value: T, offset: MotionPoint, velocity: MotionPoint): void;
	scroll(event: PointerEvent, velocity: MotionPoint): void;
	stopScroll(): void;
}
const contextKey = Symbol('astra-reorder');
export const provideReorder = <T>(context: ReorderContext<T>): ReorderContext<T> =>
	setContext(contextKey, context);
export function readReorder<T>(): ReorderContext<T> {
	const context = getContext<ReorderContext<T>>(contextKey);
	if (!context) throw new Error('Astra Reorder.Item must be a child of Reorder.Group.');
	return context;
}

/** No module-global drag state and no extra frame loop: the active gesture drives scrolling. */
export function createReorderScroll(getGroup: () => HTMLElement | null | undefined) {
	let active: { element: HTMLElement; axis: 'x' | 'y'; edge: number; limit: number } | undefined;
	return {
		stop() {
			active = undefined;
		},
		update(event: PointerEvent, velocity: MotionPoint, axis: ReorderAxis) {
			const group = getGroup();
			const view = group?.ownerDocument.defaultView;
			if (!group || !view) return;
			const selected =
				axis === 'xy'
					? !velocity.x && !velocity.y && active
						? active.axis
						: Math.abs(velocity.x) > Math.abs(velocity.y)
							? 'x'
							: 'y'
					: axis;
			let element: HTMLElement | null = group;
			while (element) {
				const style = view.getComputedStyle(element);
				const overflow = selected === 'x' ? style.overflowX : style.overflowY;
				const scrolls =
					selected === 'x'
						? element.scrollWidth > element.clientWidth
						: element.scrollHeight > element.clientHeight;
				if (/^(auto|scroll)$/.test(overflow) && scrolls) break;
				element = element.parentElement;
			}
			const documentScroll = !element;
			element ??= group.ownerDocument.scrollingElement as HTMLElement | null;
			if (!element) return;
			const rect = element.getBoundingClientRect();
			let min = documentScroll ? 0 : Math.max(0, selected === 'x' ? rect.left : rect.top);
			let max = documentScroll
				? selected === 'x'
					? view.innerWidth
					: view.innerHeight
				: Math.min(
						selected === 'x' ? view.innerWidth : view.innerHeight,
						selected === 'x' ? rect.right : rect.bottom
					);
			for (let parent = element.parentElement; parent; parent = parent.parentElement) {
				const style = view.getComputedStyle(parent);
				if (!/(auto|scroll|hidden|clip)/.test(selected === 'x' ? style.overflowX : style.overflowY))
					continue;
				const clip = parent.getBoundingClientRect();
				min = Math.max(min, selected === 'x' ? clip.left : clip.top);
				max = Math.min(max, selected === 'x' ? clip.right : clip.bottom);
			}
			if (max <= min) return;
			const pointer = selected === 'x' ? event.clientX : event.clientY;
			const edge = pointer - min < 50 ? -1 : max - pointer < 50 ? 1 : 0;
			if (!edge) {
				active = undefined;
				return;
			}
			if (
				!active ||
				active.element !== element ||
				active.axis !== selected ||
				active.edge !== edge
			) {
				if (Math.sign(velocity[selected]) !== edge) return;
				const visible = documentScroll
					? selected === 'x'
						? view.innerWidth
						: view.innerHeight
					: selected === 'x'
						? element.clientWidth
						: element.clientHeight;
				active = {
					element,
					axis: selected,
					edge,
					limit: (selected === 'x' ? element.scrollWidth : element.scrollHeight) - visible
				};
			}
			const intensity = Math.max(
				0,
				Math.min(1, 1 - (edge < 0 ? pointer - min : max - pointer) / 50)
			);
			const current = selected === 'x' ? element.scrollLeft : element.scrollTop;
			const next = Math.max(0, Math.min(active.limit, current + edge * 25 * intensity ** 2));
			if (selected === 'x') element.scrollLeft = next;
			else element.scrollTop = next;
		}
	};
}
