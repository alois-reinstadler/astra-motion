import { arc } from 'motion-dom';
import { expect, it } from 'vitest';

const delta = (x: number, y = 0) => ({
	x: { translate: x, scale: 1, origin: 0.5, originPoint: 0 },
	y: { translate: y, scale: 1, origin: 0.5, originPoint: 0 }
});

it('qualifies the shipped quadratic bend, peak and direction defaults', () => {
	expect(arc().interpolateProjection(delta(-200))!(0.5)).toEqual({ x: -100, y: 50 });
	expect(arc({ strength: 1 }).interpolateProjection(delta(-200))!(0.5)).toEqual({
		x: -100,
		y: 100
	});
	expect(arc({ peak: 0.75 }).interpolateProjection(delta(-200))!(0.5)).toEqual({
		x: -75,
		y: 50
	});
	expect(arc({ direction: 'cw' }).interpolateProjection(delta(-200))!(0.5).y).toBe(-50);
	expect(arc({ direction: 'ccw' }).interpolateProjection(delta(-200))!(0.5).y).toBe(50);
});

it('keeps automatic bends on one screen side across reversal and omits tiny layout arcs', () => {
	const path = arc();
	expect(path.interpolateProjection(delta(-200))!(0.5).y).toBe(50);
	expect(path.interpolateProjection(delta(200))!(0.5).y).toBe(50);
	expect(path.interpolateProjection(delta(19))).toBeUndefined();
	expect(path.interpolateProjection(delta(20))).toBeTypeOf('function');
});

it('scales additive rotation while leaving both endpoint rotations neutral', () => {
	const full = arc({ rotate: true }).interpolateProjection(delta(-200))!;
	const half = arc({ rotate: 0.5 }).interpolateProjection(delta(-200))!;
	expect(full(0).rotate).toBe(0);
	expect(full(1).rotate).toBe(0);
	expect(full(0.25).rotate).not.toBe(0);
	expect(half(0.25).rotate).toBe(full(0.25).rotate! / 2);
});
