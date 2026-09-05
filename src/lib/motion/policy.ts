export type ReducedMotion = 'user' | 'always' | 'never';

/** A policy object can be shared by local motion and route coordination. */
export interface MotionPolicy {
	reducedMotion?: ReducedMotion;
}

export function shouldReduceMotion(policy: MotionPolicy = {}): boolean {
	return (
		policy.reducedMotion === 'always' ||
		(policy.reducedMotion !== 'never' &&
			typeof matchMedia !== 'undefined' &&
			matchMedia('(prefers-reduced-motion: reduce)').matches)
	);
}
