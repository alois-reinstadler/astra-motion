import type {
	HTMLVisualElement,
	SVGVisualElement,
	ResolvedValues,
	VariantLabels
} from 'motion-dom';
import type { ConfigReader } from './config.js';
import type { LayoutScope } from './layout-context.js';
import type { PresenceScope } from './presence-context.svelte.js';
import type { MotionOptions, MotionBinding } from './motion-core.svelte.js';

export type MotionElement = HTMLElement | SVGElement;
export type MotionVisual = HTMLVisualElement | SVGVisualElement;
export type VariantSource = {
	initial?: VariantLabels | false;
	animate?: VariantLabels;
	exit?: VariantLabels;
};
export interface MotionTree {
	source: () => VariantSource;
	element: () => MotionElement | undefined;
}
export interface MotionEnvironment {
	config: ConfigReader;
	layout?: LayoutScope;
	presence?: PresenceScope;
	activity: () => boolean;
	parent?: MotionTree;
}
export type MotionInput = MotionOptions | (() => MotionOptions);
export type MotionBindingFactory = (
	input?: MotionInput,
	render?: MotionRenderOptions
) => MotionBinding;

/** Rendering metadata supplied by compiled tag components, separate from animation props. */
export interface MotionRenderOptions {
	environment?: MotionEnvironment;
	initialValues?: ResolvedValues;
	lazy?: boolean;
	namespace?: 'html' | 'svg';
	tag?: string;
	attributes?: () => Record<string, unknown>;
}

export function isSVGElement(node: Element): node is SVGElement {
	return node.namespaceURI === 'http://www.w3.org/2000/svg';
}
