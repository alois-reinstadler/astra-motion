import type { TargetAndTransition } from 'motion-dom';
import { spring } from 'motion-dom';
import type {
	ViewAnimationDefinition,
	ViewAnimationTarget,
	ViewTransition
} from '../motion/view-types.js';
export const target: ViewAnimationTarget = {
	opacity: [0, 1],
	transform: ['translateX(20px)', 'none'],
	filter: 'blur(0px)',
	'--tint': ['red', 'blue'],
	transition: { type: spring, bounce: 0.2, opacity: { duration: 0.2 }, layout: { duration: 0.4 } }
};
export const resolver: ViewAnimationDefinition = (types) => ({
	opacity: types.includes('forward') ? [0, 1] : 1
});
// @ts-expect-error Snapshot targets cannot commit persistent final element styles.
export const end: ViewAnimationTarget = { transitionEnd: { opacity: 0 } };
// @ts-expect-error Element transform aliases are not CSS snapshot keyframes.
export const x: ViewAnimationTarget = { x: 100 };
// @ts-expect-error An SVG drawing attribute is not a CSS snapshot property.
export const path: ViewAnimationTarget = { pathLength: 1 };
// @ts-expect-error Native View animations use the spring generator, not a string engine name.
export const timing: ViewTransition = { type: 'spring' };
const elementTarget: TargetAndTransition = { x: 100 };
// @ts-expect-error Predeclared Motion element targets do not bypass the snapshot contract.
export const widened: ViewAnimationTarget = elementTarget;
export const ordinary: TargetAndTransition = { x: 100, transitionEnd: { display: 'none' } };
