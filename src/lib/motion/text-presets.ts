import type { TextMotionOptions } from './text-types.js';

export function textPreset({
	effect = 'fade',
	direction = 'up',
	distance = 12
}: TextMotionOptions) {
	const travel = Number.isFinite(distance) ? Math.max(0, distance) : 12;
	const horizontal = direction === 'left' || direction === 'right';
	const offset = (direction === 'down' || direction === 'right' ? -1 : 1) * travel;
	return {
		hidden: {
			opacity: 0,
			transform: effect === 'fade' ? 'none' : `translate${horizontal ? 'X' : 'Y'}(${offset}px)`,
			filter: effect === 'blur' ? 'blur(4px)' : 'blur(0px)'
		},
		visible: {
			opacity: 1,
			transform: effect === 'fade' ? 'none' : `translate${horizontal ? 'X' : 'Y'}(0px)`,
			filter: 'blur(0px)'
		}
	};
}
export function textSeconds(value: number | undefined, fallback: number) {
	return value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback;
}
