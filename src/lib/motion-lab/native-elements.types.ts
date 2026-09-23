// This file is checked by svelte-check. Negative cases must stay rejected.
import type { ComponentProps } from 'svelte';
import { motion, type MotionInputProps } from '../motion/index.js';

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
