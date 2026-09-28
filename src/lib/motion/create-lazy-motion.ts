import type { Component } from 'svelte';
import type { ComponentMotionProps } from './component-props.js';
import type { MotionElement } from './motion-types.js';
import type { MotionChildren } from './motion-children.js';
import type {
	MotionElementProps,
	MotionHTMLElementTagNameMap,
	MotionSVGElementProps,
	MotionSVGTag
} from './elements/types.js';
import type { SvelteHTMLElements } from 'svelte/elements';
import CustomMotion from './CustomMotion.svelte';
import { createLazyComponentMotion as createComponentMotion } from './lazy-component-motion.svelte.js';

export interface MotionCreateOptions {
	/** Pass animation props to the custom component as well as the animation engine. */
	forwardMotionProps?: boolean;
	/** Disambiguates tags shared by HTML and SVG, including a, title, script and style. */
	namespace?: 'html' | 'svg';
}
type CreatedRef<Props> = 'ref' extends keyof Props
	? [Extract<Props['ref'], MotionElement>] extends [never]
		? MotionElement | null
		: Extract<Props['ref'], MotionElement> | null
	: MotionElement | null;
type CreatedProps<Props> = Omit<Props, keyof ComponentMotionProps | 'ref' | 'children'> &
	ComponentMotionProps & { ref?: CreatedRef<Props> } & {
		[Key in keyof Props as Key extends 'children' ? Key : never]: MotionChildren;
	};
type HTMLTag = keyof MotionHTMLElementTagNameMap & keyof SvelteHTMLElements;
type NativeComponents = typeof import('./elements/index.js');
type SpecialHTMLTag = 'a' | 'script' | 'style' | 'title' | 'body' | 'head' | 'html' | 'noscript';
type SpecialHTML = {
	a: Component<MotionElementProps<'a'>, Record<string, unknown>, 'ref'>;
	script: Component<MotionElementProps<'script'>, Record<string, unknown>, 'ref'>;
	style: Component<MotionElementProps<'style'>, Record<string, unknown>, 'ref'>;
	title: Component<MotionElementProps<'title'>, Record<string, unknown>, 'ref'>;
	body: Component<MotionElementProps<'body'>, Record<string, unknown>, 'ref'>;
	head: Component<MotionElementProps<'head'>, Record<string, unknown>, 'ref'>;
	html: Component<MotionElementProps<'html'>, Record<string, unknown>, 'ref'>;
	noscript: Component<MotionElementProps<'noscript'>, Record<string, unknown>, 'ref'>;
};
// Preserve compiled generic signatures (notably input/select) while exposing
// only the native string factory's ref binding. Wrapped components below retain
// every binding declared by the author.
type CreatedHTML<Tag extends HTMLTag> = Tag extends SpecialHTMLTag
	? SpecialHTML[Tag]
	: Tag extends keyof NativeComponents
		? NativeComponents[Tag] & { z_$$bindings?: 'ref' }
		: never;
type CreatedSVG = {
	[Tag in MotionSVGTag]: Component<MotionSVGElementProps<Tag>, Record<string, unknown>, 'ref'>;
};

export function create<Props extends object, Bindings extends keyof Props | ''>(
	component: Component<Props, Record<string, unknown>, Bindings>,
	options?: MotionCreateOptions
): Component<
	CreatedProps<Props>,
	Record<string, unknown>,
	Extract<Bindings, keyof CreatedProps<Props>> | 'ref'
>;
export function create<Tag extends HTMLTag>(
	tag: Tag,
	options?: MotionCreateOptions & { namespace?: 'html' }
): CreatedHTML<Tag>;
export function create<Tag extends MotionSVGTag>(
	tag: Tag,
	options?: MotionCreateOptions
): CreatedSVG[Tag];
export function create<Tag extends string>(
	tag: Tag,
	options?: MotionCreateOptions
): Component<CreatedProps<Record<string, unknown>>>;
export function create(
	component: Component<never> | string,
	options: MotionCreateOptions = {}
): Component<CreatedProps<Record<string, unknown>>> {
	// Forward Svelte's opaque component arguments unchanged. No renderer internals,
	// class emulation or React lifecycle is involved in this component factory.
	return (internals, props) =>
		CustomMotion(internals, {
			createBinding: createComponentMotion,
			component: component as Component<Record<string, unknown>> | string,
			options,
			values: props,
			get ref() {
				return props.ref;
			},
			set ref(node) {
				props.ref = node;
			}
		});
}
