import { describe, expect, it } from 'vitest';
import {
	detectReorderAxis,
	reorderValues,
	type ReorderBox,
	type ReorderEntry
} from '../motion/reorder-context.js';

const box = (x: number, y: number, width = 40, height = 40): ReorderBox => ({
	x: { min: x, max: x + width },
	y: { min: y, max: y + height }
});
const entry = <T>(value: T, layout: ReorderBox): ReorderEntry<T> => ({ value, layout });
const values = <T>(entries: ReorderEntry<T>[]) => entries.map((entry) => entry.value);

describe('Reorder geometry independently of rendering', () => {
	it('detects empty, horizontal, vertical, wrapped and unequal-size layouts', () => {
		expect(detectReorderAxis([])).toBe('y');
		expect(detectReorderAxis([box(0, 0)])).toBe('y');
		expect(detectReorderAxis([box(0, 0), box(50, 0)])).toBe('x');
		expect(detectReorderAxis([box(0, 0), box(0, 50)])).toBe('y');
		expect(detectReorderAxis([box(0, 0), box(50, 0), box(0, 50)])).toBe('xy');
		expect(detectReorderAxis([box(0, 0, 50, 100), box(60, 20, 80, 40)])).toBe('x');
	});
	it('crosses the adjacent center only in the current direction of movement', () => {
		const order = [entry('a', box(0, 0)), entry('b', box(0, 50)), entry('c', box(0, 100))];
		expect(reorderValues(order, 'a', { x: 0, y: 30 }, { x: 0, y: 1 }, 'y')).toBe(order);
		expect(values(reorderValues(order, 'a', { x: 0, y: 31 }, { x: 0, y: 1 }, 'y'))).toEqual([
			'b',
			'a',
			'c'
		]);
		expect(reorderValues(order, 'a', { x: 0, y: 90 }, { x: 0, y: 0 }, 'y')).toBe(order);
		expect(values(reorderValues(order, 'c', { x: 0, y: -31 }, { x: 0, y: -1 }, 'y'))).toEqual([
			'a',
			'c',
			'b'
		]);
	});
	it('preserves object identity and does not mutate the controlled order', () => {
		const a = { id: 1 };
		const b = { id: 2 };
		const order = [entry(a, box(0, 0)), entry(b, box(50, 0))];
		const result = reorderValues(order, a, { x: 40, y: 0 }, { x: 2, y: 0 }, 'x');
		expect(values(result)).toEqual([b, a]);
		expect(result[1]).toBe(order[0]);
		expect(values(order)).toEqual([a, b]);
		expect(reorderValues(order, { id: 1 }, { x: 40, y: 0 }, { x: 2, y: 0 }, 'x')).toBe(order);
	});
	it('moves across wrapped rows by horizontal insertion and honors RTL', () => {
		const order = [
			entry('a', box(0, 0)),
			entry('b', box(50, 0)),
			entry('c', box(0, 50)),
			entry('d', box(50, 50))
		];
		expect(values(reorderValues(order, 'a', { x: 0, y: 50 }, { x: 0, y: 1 }, 'xy'))).toEqual([
			'b',
			'c',
			'a',
			'd'
		]);
		expect(values(reorderValues(order, 'b', { x: 20, y: 50 }, { x: 0, y: 1 }, 'xy'))).toEqual([
			'a',
			'c',
			'd',
			'b'
		]);
		const rtl = [
			entry('a', box(50, 0)),
			entry('b', box(0, 0)),
			entry('c', box(50, 50)),
			entry('d', box(0, 50))
		];
		expect(values(reorderValues(rtl, 'a', { x: 0, y: 50 }, { x: 0, y: 1 }, 'xy', true))).toEqual([
			'b',
			'c',
			'a',
			'd'
		]);
	});
	it('reorders a right-to-left row with the explicit two-dimensional algorithm', () => {
		const order = [entry('a', box(50, 0)), entry('b', box(0, 0))];
		expect(
			values(reorderValues(order, 'a', { x: -31, y: 0 }, { x: -1, y: 0 }, 'xy', true))
		).toEqual(['b', 'a']);
		expect(values(reorderValues(order, 'b', { x: 31, y: 0 }, { x: 1, y: 0 }, 'xy', true))).toEqual([
			'b',
			'a'
		]);
	});
	it('uses nearest boxes in a row, including zero-velocity layout changes', () => {
		const order = [entry('a', box(0, 0)), entry('b', box(50, 0)), entry('c', box(100, 0))];
		expect(values(reorderValues(order, 'a', { x: 110, y: 0 }, { x: 0, y: 0 }, 'xy'))).toEqual([
			'b',
			'a',
			'c'
		]);
		expect(reorderValues(order, 'a', { x: 0, y: 0 }, { x: 0, y: 0 }, 'xy')).toBe(order);
	});
});
