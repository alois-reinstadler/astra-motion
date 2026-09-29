import { expect, it, vi } from 'vitest';
import { diagnoseMotionOptions, diagnoseInfiniteExit } from './diagnostics.js';
import { componentMotionOptions } from './component-props.js';
it('deduplicates actionable local conflicts and avoids inherited-label false positives', () => {
	vi.stubEnv('NODE_ENV', 'development');
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const owner = {};
		diagnoseMotionOptions(owner, { animate: 'parent-label' });
		componentMotionOptions({ animate: { x: [0, 1] } }, { animate: { x: [0, 1] } }, undefined);
		expect(warning).not.toHaveBeenCalled();
		for (let i = 0; i < 2; i++)
			diagnoseMotionOptions(owner, {
				inherit: false,
				animate: 'typo',
				variants: { shown: { x: 1 } }
			});
		expect(warning).toHaveBeenCalledTimes(1);
		diagnoseMotionOptions(owner, { animate: { transform: 'rotate(10deg)', x: 100 } });
		expect(warning).toHaveBeenCalledTimes(2);
		diagnoseInfiniteExit(owner, { opacity: 0, transition: { opacity: { repeat: Infinity } } });
		expect(warning).toHaveBeenCalledTimes(3);
		const flat = { animate: { x: 2 } };
		const legacy = { animate: { x: 1 } };
		componentMotionOptions(legacy, flat, undefined);
		componentMotionOptions(legacy, flat, undefined);
		expect(warning).toHaveBeenCalledTimes(4);
		expect(componentMotionOptions(legacy, flat, undefined).animate).toBe(flat.animate);
	} finally {
		warning.mockRestore();
		vi.unstubAllEnvs();
	}
});

it('checks only effective transitions of actual exit properties', () => {
	vi.stubEnv('NODE_ENV', 'development');
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		// A target transition replaces component defaults unless inherit is explicit.
		diagnoseInfiniteExit({}, { opacity: 0, transition: { duration: 0.1 } }, { repeat: Infinity });
		diagnoseInfiniteExit(
			{},
			{ opacity: 0, transition: { opacity: { repeat: 0 } } },
			{ repeat: Infinity }
		);
		diagnoseInfiniteExit({}, { opacity: 0 }, { repeat: Infinity, opacity: { repeat: 0 } });
		diagnoseInfiniteExit({}, { opacity: 0 }, { repeat: Infinity, default: { repeat: 0 } });
		diagnoseInfiniteExit({}, { opacity: 0 }, { x: { repeat: Infinity } });
		diagnoseInfiniteExit({}, { x: undefined, transitionEnd: { opacity: 0 } }, { repeat: Infinity });
		diagnoseInfiniteExit({}, { opacity: 0 }, { repeat: Infinity, skipAnimations: true });
		expect(warning).not.toHaveBeenCalled();
		// Explicit inheritance still exposes the inherited infinite repetition.
		diagnoseInfiniteExit(
			{},
			{ opacity: 0, transition: { inherit: true, duration: 0.1 } },
			{ repeat: Infinity }
		);
		diagnoseInfiniteExit({}, { opacity: 0 }, { default: { repeat: Infinity } });
		diagnoseInfiniteExit(
			{},
			{ opacity: 0 },
			{ repeat: Infinity, opacity: { inherit: true, duration: 0.1 } }
		);
		expect(warning).toHaveBeenCalledTimes(3);
	} finally {
		warning.mockRestore();
		vi.unstubAllEnvs();
	}
});

it('compares cyclic custom values without crashing and still diagnoses different data', () => {
	vi.stubEnv('NODE_ENV', 'development');
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		type Circular = { self?: Circular; value: number };
		const one: Circular = { value: 1 };
		one.self = one;
		const two: Circular = { value: 1 },
			child: Circular = { value: 1 };
		two.self = child;
		child.self = two;
		// Equivalent recursive contents do not conflict solely because cycle lengths differ.
		expect(componentMotionOptions({ custom: one }, { custom: two }, undefined).custom).toBe(two);
		expect(warning).not.toHaveBeenCalled();
		child.value = 2;
		const direct = { custom: two };
		expect(componentMotionOptions({ custom: one }, direct, undefined).custom).toBe(two);
		componentMotionOptions({ custom: one }, direct, undefined);
		expect(warning).toHaveBeenCalledTimes(1);
		expect(warning).toHaveBeenCalledWith(expect.stringContaining('conflicting-custom'));
	} finally {
		warning.mockRestore();
		vi.unstubAllEnvs();
	}
});

it('does not traverse diagnostic values or emit warnings in production', () => {
	vi.stubEnv('NODE_ENV', 'production');
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const custom = {
			get value(): never {
				throw new Error('diagnostic traversed custom');
			}
		};
		expect(componentMotionOptions({ custom }, { custom: { value: 2 } }, undefined).custom).toEqual({
			value: 2
		});
		diagnoseInfiniteExit({}, { opacity: 0 }, { repeat: Infinity });
		expect(warning).not.toHaveBeenCalled();
	} finally {
		warning.mockRestore();
		vi.unstubAllEnvs();
	}
});
