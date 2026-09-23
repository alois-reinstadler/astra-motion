import { expect, it } from 'vitest';
import { motionValue } from 'motion-dom';
import { snapshotMotionOptions } from './options-snapshot.js';

it('copies option records and keyframes while preserving MotionValue and custom identities', () => {
	const x = motionValue(20);
	const custom = { item: 1 };
	const input = { animate: { y: [0, 10] }, style: { x }, custom };
	const snapshot = snapshotMotionOptions(input);
	input.animate.y[1] = 30;
	expect(snapshot.animate).toEqual({ y: [0, 10] });
	expect(snapshot.style?.x).toBe(x);
	expect(snapshot.custom).toBe(custom);
});
