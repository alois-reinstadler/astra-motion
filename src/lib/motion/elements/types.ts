import type {
	DOMAttributes,
	HTMLInputTypeAttribute,
	SvelteHTMLElements,
	SVGAttributes
} from 'svelte/elements';
import type { MotionChildren } from '../motion-children.js';
import type { ComponentMotionProps } from '../component-props.js';
import type { MotionValue } from 'motion-dom';

export type MotionSVGTag = keyof SVGElementTagNameMap & keyof SvelteHTMLElements;
/** param remains usable even though TypeScript classifies it as a deprecated tag. */
export type MotionHTMLElementTagNameMap = HTMLElementTagNameMap &
	Pick<HTMLElementDeprecatedTagNameMap, 'param'>;
type AnimatedAttributes<Props> = {
	[Key in keyof Props]:
		| Props[Key]
		| (NonNullable<Props[Key]> extends string | number
				? MotionValue<string> | MotionValue<number>
				: never);
};
/** Shared namespaces retain native attributes without duplicating Motion's large option union. */
export type MotionAmbiguousTag = 'a' | 'script' | 'style' | 'title';
type AmbiguousNativeProps<Tag extends MotionAmbiguousTag> = {
	[
		Key in Exclude<
			keyof SvelteHTMLElements[Tag] | keyof SVGAttributes<SVGElementTagNameMap[Tag]>,
			keyof ComponentMotionProps | `bind:${string}` | 'children'
		>
	]?: Key extends keyof DOMAttributes<MotionHTMLElementTagNameMap[Tag] | SVGElementTagNameMap[Tag]>
		? DOMAttributes<MotionHTMLElementTagNameMap[Tag] | SVGElementTagNameMap[Tag]>[Key]
		: | (Key extends keyof SvelteHTMLElements[Tag] ? SvelteHTMLElements[Tag][Key] : never)
			| (Key extends keyof SVGAttributes<SVGElementTagNameMap[Tag]>
					? AnimatedAttributes<SVGAttributes<SVGElementTagNameMap[Tag]>>[Key]
					: never);
};
export type MotionAmbiguousElementProps<Tag extends MotionAmbiguousTag> =
	AmbiguousNativeProps<Tag> &
		ComponentMotionProps & {
			children?: MotionChildren;
			ref?: MotionHTMLElementTagNameMap[Tag] | SVGElementTagNameMap[Tag] | null;
			attrX?: number | string;
			attrY?: number | string;
			attrScale?: number | string;
		};
export type MotionSVGElementProps<Tag extends MotionSVGTag> = AnimatedAttributes<
	Omit<
		SVGAttributes<SVGElementTagNameMap[Tag]>,
		keyof ComponentMotionProps | `bind:${string}` | 'children'
	>
> &
	ComponentMotionProps & {
		children?: MotionChildren;
		ref?: SVGElementTagNameMap[Tag] | null;
		attrX?: number | string;
		attrY?: number | string;
		attrScale?: number | string;
	};

/** A compiled HTML element: native attributes/events, a DOM ref and motion options. */
export type MotionElementProps<
	Tag extends keyof MotionHTMLElementTagNameMap & keyof SvelteHTMLElements
> = Omit<
	SvelteHTMLElements[Tag],
	| keyof ComponentMotionProps
	| 'children'
	| `bind:${string}`
	| (Tag extends
			| 'area'
			| 'base'
			| 'br'
			| 'col'
			| 'embed'
			| 'hr'
			| 'img'
			| 'input'
			| 'link'
			| 'meta'
			| 'param'
			| 'source'
			| 'track'
			| 'wbr'
			? 'children'
			: never)
> &
	ComponentMotionProps & {
		ref?: MotionHTMLElementTagNameMap[Tag] | null;
		children?: Tag extends
			| 'area'
			| 'base'
			| 'br'
			| 'col'
			| 'embed'
			| 'hr'
			| 'img'
			| 'input'
			| 'link'
			| 'meta'
			| 'param'
			| 'source'
			| 'track'
			| 'wbr'
			| 'textarea'
			? never
			: MotionChildren;
	};

/** Native input bindings; checked/indeterminate apply to checkboxes, files to file inputs. */
export type MotionInputProps<Type extends HTMLInputTypeAttribute | null = 'text'> = Omit<
	MotionElementProps<'input'>,
	'type' | 'value' | 'group' | 'files' | 'indeterminate'
> & {
	type?: Type;
	value?: Type extends 'file'
		? never
		: Type extends 'number' | 'range'
			? number | null
			: string | null;
	indeterminate?: Type extends 'checkbox' ? boolean | null : never;
	files?: Type extends 'file' ? FileList | null : never;
};

/** Option values retain their identity, including objects and arrays for multiple selects. */
export type MotionSelectProps<Value = unknown> = Omit<MotionElementProps<'select'>, 'value'> & {
	value?: Value;
};

export type MotionTextareaProps = Omit<MotionElementProps<'textarea'>, 'value' | 'children'> & {
	value?: string | null;
};
export type MotionDetailsProps = MotionElementProps<'details'>;

/** Internal implementation accepts the union of native value-input types across branches. */
export type NativeInputProps = Omit<MotionElementProps<'input'>, 'value'> & {
	value?: string | number | null;
	indeterminate?: boolean | null;
	files?: FileList | null;
};
