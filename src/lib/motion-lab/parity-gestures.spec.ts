import { describe, expect, it, vi } from 'vitest';
import { DragControls, useDragControls } from '../motion/drag-controls.js';
import { constrainDrag, resolveDragElastic, validateDragConstraints } from '../motion/gestures.js';
import {
	correctParentTransform,
	resolveElement,
	transformViewBoxPoint
} from '../motion/coordinates.js';

describe('drag public contracts without a browser', () => {
	it('uses the actual Motion 13.4.4 elastic default and resolves individual edges', () => {
		expect(resolveDragElastic()).toEqual({ left: 0.35, right: 0.35, top: 0.35, bottom: 0.35 });
		expect(resolveDragElastic(true)).toEqual(resolveDragElastic());
		expect(resolveDragElastic(false)).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
		expect(resolveDragElastic({ left: 1, bottom: 0.1 })).toEqual({
			left: 1,
			right: 0,
			top: 0,
			bottom: 0.1
		});
		expect(constrainDrag(120, 0, 100, 0.35, 0.35)).toBe(107);
		expect(constrainDrag(-20, 0, 100, 0.35, 0.35)).toBe(-7);
		expect(constrainDrag(120, 0, 100, 0, 0)).toBe(100);
		expect(constrainDrag(120, undefined, undefined, 0, 0)).toBe(120);
	});
	it('rejects invalid bounds and elasticity before an interaction allocates resources', () => {
		for (const elastic of [-1, 2, Infinity, NaN, { left: NaN }])
			expect(() => resolveDragElastic(elastic)).toThrow();
		expect(() => validateDragConstraints({ left: 10, right: 0 })).toThrow('left <= right');
		expect(() => validateDragConstraints({ bottom: Infinity })).toThrow('finite numbers');
		expect(() => validateDragConstraints({ top: -10 })).not.toThrow();
	});
	it('creates independent SSR-safe controls and routes stop versus cancel to live participants', () => {
		const controls = useDragControls();
		const other = useDragControls();
		const first = { start: vi.fn(), stop: vi.fn(), cancel: vi.fn() };
		const second = { start: vi.fn(), stop: vi.fn(), cancel: vi.fn() };
		const remove = controls.subscribe(first);
		controls.subscribe(second);
		const pointer = { pointerId: 1 } as PointerEvent;
		controls.start(pointer, { snapToCursor: true, distanceThreshold: 8 });
		expect(first.start).toHaveBeenCalledWith(pointer, { snapToCursor: true, distanceThreshold: 8 });
		remove();
		controls.stop();
		controls.cancel();
		other.stop();
		expect(first.stop).not.toHaveBeenCalled();
		expect(first.cancel).not.toHaveBeenCalled();
		expect(second.stop).toHaveBeenCalledOnce();
		expect(second.cancel).toHaveBeenCalledOnce();
		expect(controls).toBeInstanceOf(DragControls);
	});
	it('rejects an invalid threshold before starting any participant', () => {
		const controls = new DragControls();
		const participant = { start: vi.fn(), stop: vi.fn(), cancel: vi.fn() };
		controls.subscribe(participant);
		for (const distanceThreshold of [-1, NaN, Infinity])
			expect(() => controls.start({} as PointerEvent, { distanceThreshold })).toThrow(
				'distanceThreshold'
			);
		expect(participant.start).not.toHaveBeenCalled();
	});
	it('resolves current and getter refs live and leaves unresolved SSR coordinates unchanged', () => {
		const ref: { current: Element | null } = { current: null };
		expect(resolveElement(ref)).toBeUndefined();
		const element = {} as Element;
		ref.current = element;
		expect(resolveElement(ref)).toBe(element);
		expect(resolveElement(() => ref.current)).toBe(element);
		const point = { x: 25, y: 50 };
		expect(correctParentTransform(() => undefined)(point)).toBe(point);
		expect(transformViewBoxPoint(() => undefined)(point)).toBe(point);
	});
});
