import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { useCycle, toMotionValue } from '../motion/index.js';

it('tracks rune-backed getter sources and stops their effects on destroy', () => {
	let progress = $state(0);
	let reads = 0;
	const value = toMotionValue(() => {
		reads++;
		return progress / 100;
	});
	expect(value.get()).toBe(0);
	progress = 50;
	flushSync();
	expect(value.get()).toBe(0.5);
	value.destroy();
	const finalReads = reads;
	progress = 75;
	flushSync();
	expect(value.get()).toBe(0.5);
	expect(reads).toBe(finalReads);
});

it('clamps a changing cycle list, recovers from emptiness and avoids same-index effects', () => {
	let items = $state.raw(['a', 'b', 'c']);
	const cycle = useCycle(() => items);
	const observed: string[] = [];
	const stop = $effect.root(() => {
		$effect(() => {
			observed.push(cycle.current);
		});
	});
	try {
		flushSync();
		cycle.cycle(0);
		flushSync();
		expect(observed).toEqual(['a']);
		cycle.cycle(2);
		flushSync();
		expect(cycle.current).toBe('c');
		items = ['x'];
		flushSync();
		expect(cycle.current).toBe('x');
		stop();
		items = [];
		expect(() => cycle.current).toThrow('at least one');
		items = ['first', 'second'];
		cycle.cycle(1);
		expect(cycle.current).toBe('second');
	} finally {
		stop();
	}
});
