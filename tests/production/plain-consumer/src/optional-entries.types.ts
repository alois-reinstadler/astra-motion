import type { ComponentProps, Snippet } from 'svelte';
import {
	TextReveal,
	TextSwap,
	type TextRevealProps,
	type TextSwapProps,
	type TextMotionOptions,
	type TextEffect,
	type TextSplit,
	type TextDirection,
	type TextHost
} from 'astra-motion/text';
import { Tilt, type TiltProps, type TiltOptions } from 'astra-motion/tilt';

export type OptionalContracts = [
	TextRevealProps,
	TextSwapProps,
	TextMotionOptions,
	TextEffect,
	TextSplit,
	TextDirection,
	TextHost,
	TiltProps,
	TiltOptions
];
export const reveal: ComponentProps<typeof TextReveal> = {
	text: 'Hello 👩🏽‍💻',
	as: 'h2',
	effect: 'blur',
	split: 'graphemes',
	direction: 'left',
	distance: 12,
	stagger: 0.02,
	duration: 0.2,
	locale: 'de-AT',
	trigger: 'viewport',
	once: false,
	viewport: { margin: '10px', amount: 0.5 },
	class: 'headline'
};
export const swap: ComponentProps<typeof TextSwap> = {
	text: 'Save',
	mode: 'wait',
	size: 'reserve',
	alternatives: ['Save', 'Saved'] as const,
	overflow: 'clip',
	live: 'polite'
};
export function tiltProps(children: Snippet): ComponentProps<typeof Tilt> {
	return {
		children,
		perspective: 900,
		maxRotateX: 8,
		maxRotateY: 10,
		axis: 'x',
		spring: { stiffness: 260, damping: 26, mass: 1 },
		disabled: true,
		onpointermove(event) {
			const host: HTMLDivElement = event.currentTarget;
			host.getBoundingClientRect();
		}
	};
}
// @ts-expect-error A plain-text message is required.
export const missingText: ComponentProps<typeof TextReveal> = {};
// @ts-expect-error Measured lines are outside the supported segmentation contract.
export const invalidSplit: TextSplit = 'lines';
// @ts-expect-error Interactive hosts are composed around the plain-text component.
export const invalidHost: TextHost = 'button';
// @ts-expect-error Swap modes are a closed public contract.
export const invalidMode: TextSwapProps = { text: 'Save', mode: 'replace' };
// @ts-expect-error Tilt only supports its two axes or both together.
export const invalidTiltAxis: TiltOptions = { axis: 'z' };
// @ts-expect-error Tilt requires a children snippet.
export const missingTiltContent: ComponentProps<typeof Tilt> = { disabled: true };
