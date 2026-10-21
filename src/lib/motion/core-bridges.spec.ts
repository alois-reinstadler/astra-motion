import { expect, it, vi } from 'vitest';
import { writable } from 'svelte/store';
import * as dom from 'motion-dom';
import {
	useCycle,
	toMotionValue,
	styleEffect,
	propEffect,
	attrEffect,
	svgEffect,
	createEffect
} from './index.js';

it('cycles through values, wraps after a jump and clamps out-of-range reads', () => {
	const a = {},
		b = {};
	const cycle = useCycle(a, b);
	expect(cycle.current).toBe(a);
	cycle.cycle();
	expect(cycle.current).toBe(b);
	cycle.cycle();
	expect(cycle.current).toBe(a);
	cycle.cycle(99);
	expect(cycle.current).toBe(b);
	cycle.cycle(-4);
	expect(cycle.current).toBe(a);
	cycle.cycle(1);
	cycle.cycle();
	expect(cycle.current).toBe(a);
});

it.each([NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])(
	'rejects invalid cycle index %s without changing selection',
	(index) => {
		const cycle = useCycle('a', 'b');
		expect(() => cycle.cycle(index)).toThrow('safe integer');
		expect(cycle.current).toBe('a');
	}
);

it('rejects empty cycles and keeps singleton cycles stable without a browser', () => {
	expect(typeof document).toBe('undefined');
	expect(() => useCycle()).toThrow('at least one');
	const cycle = useCycle('only');
	cycle.cycle();
	expect(cycle.current).toBe('only');
});

it('preserves borrowed MotionValue identity and exposes the same engine effects', () => {
	const source = dom.motionValue(1),
		destroyed = vi.fn();
	source.on('destroy', destroyed);
	expect(toMotionValue(source)).toBe(source);
	expect(destroyed).not.toHaveBeenCalled();
	expect([styleEffect, propEffect, attrEffect, svgEffect, createEffect]).toEqual([
		dom.styleEffect,
		dom.propEffect,
		dom.attrEffect,
		dom.svgEffect,
		dom.createEffect
	]);
	source.destroy();
	expect(destroyed).toHaveBeenCalledOnce();
});

it('subscribes once to a readable, mirrors updates and releases the subscription exactly once', () => {
	const store = writable(0);
	let subscriptions = 0;
	const source = {
		subscribe: (run: (value: number) => void) => {
			subscriptions++;
			const stop = store.subscribe(run);
			return () => {
				subscriptions--;
				stop();
			};
		}
	};
	const value = toMotionValue(source);
	expect(dom.isMotionValue(value)).toBe(true);
	expect(value.get()).toBe(0);
	expect(subscriptions).toBe(1);
	store.set(25);
	expect(value.get()).toBe(25);
	value.destroy();
	value.destroy();
	expect(subscriptions).toBe(0);
	store.set(99);
	expect(value.get()).toBe(25);
});

it('seeds a getter snapshot on the server without browser effects', () => {
	expect(typeof window).toBe('undefined');
	const value = toMotionValue(() => 42);
	expect(value.get()).toBe(42);
	value.destroy();
});
