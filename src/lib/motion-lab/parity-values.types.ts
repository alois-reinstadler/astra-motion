import type { MotionValue } from 'motion-dom';
import {
	useMotionValue,
	useMotionTemplate,
	useMotionValueEvent,
	useSpring,
	useTransform,
	useVelocity
} from '../motion/value-hooks.svelte.js';
import { useAnimate } from '../motion/use-animate.svelte.js';
import { useInView, useReducedMotion } from '../motion/helper-hooks.svelte.js';

// This function is checked by svelte-check and never executes. It verifies public inference.
export function checkValueInference() {
	const x: MotionValue<number> = useMotionValue(0);
	const text: MotionValue<string> = useMotionValue('a');
	const spring: MotionValue<number> = useSpring(0);
	spring.set(100);
	const units: MotionValue<string> = useSpring('0px');
	units.set('100px');
	const output: MotionValue<string> = useTransform(
		[x, text] as const,
		([number, string]) => `${number.toFixed(0)}${string.toUpperCase()}`
	);
	const mapped = useTransform(x, [0, 1], { number: [0, 10], color: ['#000', '#fff'] });
	const n: MotionValue<number> = mapped.number;
	const c: MotionValue<string> = mapped.color;
	const value: MotionValue<string> = useMotionTemplate`${x} ${0} ${() => 'px'}`;
	const velocity: MotionValue<number> = useVelocity(x);
	useMotionValueEvent(x, 'change', (latest) => latest.toFixed());
	// @ts-expect-error Numeric value events do not deliver strings.
	useMotionValueEvent(x, 'change', (latest: string) => latest.toUpperCase());
	// @ts-expect-error Spring targets must be numerical or unit strings.
	useSpring({ arbitrary: true });
	const [scope, animate] = useAnimate<HTMLDivElement>();
	const inView = useInView(scope);
	const reduced: boolean | null = useReducedMotion().current;
	animate(x, 100);
	animate({ opacity: 0 }, { opacity: 1 });
	animate([
		[x, [0, 10]],
		['div', { opacity: 1 }]
	]);
	return { output, n, c, value, velocity, inView, reduced };
}
