// Compile-only assertions: known factory tags and wrapped Svelte props retain inference.
import type { ComponentProps } from 'svelte';
import { motion, motionValue } from '../motion/index.js';
import * as m from '../motion/m/index.js';
import Button from './ParityCompositionButton.svelte';
import CircleComponent from './ParityCompositionCircle.svelte';

export const NativeButton = motion.create('button');
export const NativeInput = motion.create('input');
export const Circle = motion.create('circle');
export const SVGLink = motion.create('a', { namespace: 'svg' });
export const HTMLLink = motion.create('a');
export const NumberInput = NativeInput<'number'>;
export const WrappedButton = motion.create(Button);
export const LazyButton = m.create('button');
export const LazyCircle = m.create('circle');
export const LazyWrappedButton = m.create(Button);
export const WrappedCircle = motion.create(CircleComponent, { namespace: 'svg' });
export const LazySVGLink = m.create('a', { namespace: 'svg' });
export const SVGPath = motion.create('path');
declare const buttonReference: HTMLButtonElement;
declare const circleReference: SVGCircleElement;

export const native: ComponentProps<typeof NativeButton> = {
	type: 'submit',
	onclick(event) {
		const node: HTMLButtonElement = event.currentTarget;
		node.checkValidity();
	},
	ref: null,
	children: motionValue(2)
};
export const svg: ComponentProps<typeof Circle> = {
	cx: 25,
	r: motionValue(12),
	onclick(event) {
		const node: SVGCircleElement = event.currentTarget;
		node.getBBox();
	},
	ref: null
};
export const svgLink: ComponentProps<typeof SVGLink> = {
	href: '/docs',
	onclick(event) {
		const node: SVGAElement = event.currentTarget;
		node.getBBox();
	}
};
export const wrapped: ComponentProps<typeof WrappedButton> = {
	label: 'Press',
	count: 1,
	children: motionValue('Live')
};
export const lazy: ComponentProps<typeof LazyButton> = { type: 'button', children: 'Lazy' };
export const lazySVG: ComponentProps<typeof LazyCircle> = { cx: 10, r: 20 };
export const lazyWrapped: ComponentProps<typeof LazyWrappedButton> = {
	label: 'Press',
	children: motionValue(3)
};
export const invalidButton: ComponentProps<typeof NativeButton> = {
	// @ts-expect-error Native button factories cannot accept anchor-only props.
	href: '/invalid'
};
export const invalidInput: ComponentProps<typeof NativeInput> = {
	// @ts-expect-error Void native factories reject children.
	children: 'Invalid'
};
export const invalidCircle: ComponentProps<typeof Circle> = {
	// @ts-expect-error Native SVG events retain their real element type.
	onclick: (event: MouseEvent & { currentTarget: HTMLInputElement }) => event.currentTarget.select()
};
// @ts-expect-error Wrapped Svelte required props are still required.
export const missingLabel: ComponentProps<typeof WrappedButton> = { count: 1 };
export const invalidWrapped: ComponentProps<typeof WrappedButton> = {
	label: 'Press',
	// @ts-expect-error Wrapped Svelte bindable props retain their numeric type.
	count: '1'
};
export const invalidLazy: ComponentProps<typeof LazyButton> = {
	// @ts-expect-error Lightweight factories preserve the same native attribute types.
	href: '/invalid'
};

export const htmlLink: ComponentProps<typeof HTMLLink> = {
	href: '/docs',
	onclick(event) {
		const node: HTMLAnchorElement = event.currentTarget;
		node.href = '/examples';
	}
};
export const invalidNumericFactory: ComponentProps<typeof NumberInput> = {
	type: 'number',
	// @ts-expect-error Numeric input factory specialization keeps the number contract.
	value: 'not a number'
};
export const wrappedCircle: ComponentProps<typeof WrappedCircle> = {
	label: 'Circle',
	ref: circleReference,
	r: 12
};
export const invalidWrappedRef: ComponentProps<typeof WrappedCircle> = {
	label: 'Circle',
	// @ts-expect-error A wrapped SVG component keeps its declared native ref type.
	ref: buttonReference
};
export const lazyLink: ComponentProps<typeof LazySVGLink> = {
	href: '#target',
	onclick(event) {
		const element: SVGAElement = event.currentTarget;
		element.getBBox();
	}
};
export const path: ComponentProps<typeof SVGPath> = {
	d: 'M0 0L10 10',
	onclick(event) {
		const element: SVGPathElement = event.currentTarget;
		element.getTotalLength();
	}
};
