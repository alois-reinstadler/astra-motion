import type { HTMLInputTypeAttribute, SvelteHTMLElements } from 'svelte/elements';
import type { ComponentMotionProps } from '../component-props.js';

/** A compiled HTML element: native attributes/events, a DOM ref and motion options. */
export type MotionElementProps<Tag extends keyof HTMLElementTagNameMap & keyof SvelteHTMLElements> =
	Omit<
		SvelteHTMLElements[Tag],
		| keyof ComponentMotionProps
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
			ref?: HTMLElementTagNameMap[Tag] | null;
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
