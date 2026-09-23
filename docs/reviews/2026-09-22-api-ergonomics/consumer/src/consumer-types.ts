import {
	createMotion,
	createLayout,
	createAnimate,
	createScroll,
	createInView,
	motionValue,
	type MotionOptions
} from 'astra-motion';
import { createMotion as lite } from 'astra-motion/state/lite';
import { Presence, presence, popLayout } from 'astra-motion/presence';
import { routeShared } from 'astra-motion/routes';
export const publicTypes = [
	createMotion,
	createLayout,
	createAnimate,
	createScroll,
	createInView,
	motionValue,
	lite,
	Presence,
	presence,
	popLayout,
	routeShared
];
export const options: MotionOptions = { animate: { x: 20 } };
