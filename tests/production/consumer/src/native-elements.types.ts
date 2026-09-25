// This file is checked by svelte-check. Negative cases must stay rejected.
import type { ComponentProps } from 'svelte';
import { motion, motionValue, type MotionInputProps, type MotionProps } from 'astra-motion';

export const button: ComponentProps<typeof motion.button> = {
	type: 'submit',
	disabled: true,
	form: 'checkout',
	onclick(event) {
		const element: HTMLButtonElement = event.currentTarget;
		element.checkValidity();
	},
	ref: null
};
export const input: MotionInputProps<'number'> = { type: 'number', value: 3 };
export const emptyInput: MotionInputProps<'number'> = { type: 'number', value: null };
export const anchor: ComponentProps<typeof motion.a> = { href: '/docs', target: '_blank' };
export const invalidButton: ComponentProps<typeof motion.button> = {
	// @ts-expect-error href is an anchor attribute, not a button attribute.
	href: '/docs'
};
export const invalidRef: ComponentProps<typeof motion.button> = {
	// @ts-expect-error button refs retain the actual native element type.
	ref: {} as HTMLInputElement
};
export const invalidNumber: MotionInputProps<'number'> = {
	type: 'number',
	// @ts-expect-error numeric input bindings produce numbers (or null when empty).
	value: '3'
};
export const invalidGroup: MotionInputProps = {
	// @ts-expect-error bind:group requires native inputs in one Svelte component.
	group: []
};

export const flatAnimation: ComponentProps<typeof motion.div> = {
	initial: false,
	animate: { x: 120 },
	exit: { opacity: 0 },
	transition: { type: 'spring', stiffness: 300, damping: 30 },
	style: { x: motionValue(0), color: 'red', '--accent': '#f00' },
	layout: { mode: 'position' },
	whileHover: { scale: 1.1 },
	onTap(event, info) {
		void event;
		void info.point.x;
	},
	motion: { animate: { x: 20 } }
};
export const genericFlat: MotionProps<'button'> = {
	as: 'button',
	type: 'submit',
	disabled: null,
	animate: { opacity: 1 },
	style: 'color:red'
};
export const invalidFlat: ComponentProps<typeof motion.div> = {
	// @ts-expect-error Animation definitions do not accept booleans.
	animate: true
};
export const invalidStyle: ComponentProps<typeof motion.div> = {
	// @ts-expect-error Styles accept native CSS strings or Motion style objects, not numbers.
	style: 42
};

export const invalidGenericButton: MotionProps<'button'> = {
	// @ts-expect-error Generic Motion keeps native attributes specific to its tag.
	href: '/docs'
};
export const genericObjectStyle: MotionProps<'button'> = {
	as: 'button',
	style: { x: motionValue(12), color: 'red' },
	onclick(event) {
		const button: HTMLButtonElement = event.currentTarget;
		button.checkValidity();
	}
};
