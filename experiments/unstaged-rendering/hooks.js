import { untrack, tick } from 'svelte';
import { Batch } from 'virtual:probe-batch';
import { __probeBegin } from '../../src/lib/motion/layout.ts';
let enabled = false;
let installed = false;
let selected = 'control';
let active = false;
let finish;
export const stats = { captures: 0, callbacks: 0, batchCalls: 0 };
export const inCapture = () => active;
// ponytail: snapshots all participants (O(n)); qualify dirty-set selection before optimizing.
export function begin() {
	if (!enabled || active) return false;
	active = true; // Must precede snapshot policy getters and user callbacks.
	try {
		finish = untrack(__probeBegin);
		if (!finish) {
			active = false;
			return false;
		}
		stats.captures++;
		return true;
	} catch (error) {
		active = false;
		throw error;
	}
}
export function end() {
	try {
		finish?.();
	} finally {
		finish = undefined;
		active = false;
	}
}
export function captureDeferred(afterTick = false) {
	if (begin()) {
		const transaction = finish;
		const close = () => {
			if (finish === transaction) end();
		};
		if (afterTick) void tick().then(close);
		else queueMicrotask(close);
	}
}
export function compilerCallback(fn) {
	if (!fn) return fn;
	return function (...args) {
		stats.callbacks++;
		if (selected === 'compiler') captureDeferred();
		return fn.apply(this, args);
	};
}
export function install(mode, version = '5.57.0') {
	if (version !== '5.57.0') throw new Error(`Unqualified Svelte version: ${version}`);
	if (installed) throw new Error('Probe already installed');
	installed = true;
	for (const key in stats) stats[key] = 0;
	selected = mode;
	enabled = mode !== 'control';
	const original = Batch.prototype.flush;
	const wrapped = function (...args) {
		stats.batchCalls++;
		const owns = begin();
		try {
			return original.apply(this, args);
		} finally {
			if (owns) end();
		}
	};
	if (mode === 'batch') Batch.prototype.flush = wrapped;
	let disposed = false;
	return () => {
		if (disposed) return;
		disposed = true;
		const replaced = mode === 'batch' && Batch.prototype.flush !== wrapped;
		try {
			if (active) end();
		} finally {
			enabled = false;
			installed = false;
			selected = 'control';
			if (mode === 'batch' && !replaced) Batch.prototype.flush = original;
		}
		if (replaced) throw new Error('Another adapter replaced this probe');
	};
}
