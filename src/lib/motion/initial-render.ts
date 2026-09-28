import {
	buildHTMLStyles,
	isMotionValue,
	isForcedMotionValue,
	resolveMotionValue,
	camelToDash,
	type ResolvedValues,
	type MotionNodeOptions,
	type HTMLRenderState
} from 'motion-dom';
import type { MotionOptions } from './motion-core.svelte.js';
import type { MotionRenderOptions } from './motion-types.js';
import { resolveMotionTarget } from './targets.js';
import { svgMotionValues, svgRenderState, svgAttributeName } from './svg.js';
// Motion's forced values include transform/origin and projection-corrected CSS.
// Radius/shadow correctors register on first layout mount; classify them the same during SSR.
export function styleValues(options: MotionOptions, owned: boolean): ResolvedValues {
	const values: ResolvedValues = {};
	for (const [key, value] of Object.entries(options.style ?? {})) {
		if (
			(isMotionValue(value) ||
				isForcedMotionValue(key, {
					layout: Boolean(options.layout) || options.layoutId !== undefined
				}) ||
				((Boolean(options.layout) || options.layoutId !== undefined) &&
					(key === 'borderRadius' || key === 'boxShadow'))) !== owned
		)
			continue;
		const latest = resolveMotionValue(value);
		if (typeof latest === 'number' || typeof latest === 'string') values[key] = latest;
	}
	return values;
}

export function resolveInitialMotionValues(
	options: MotionOptions,
	render: MotionRenderOptions = {}
): ResolvedValues {
	const values = { ...svgMotionValues(render.attributes?.() ?? {}), ...styleValues(options, true) };
	const component = render.component;
	const immediate = options.initial === false || (!component && options.reducedMotion === 'always');
	const target = resolveMotionTarget(
		options as MotionNodeOptions,
		immediate
			? options.animate
			: ((options.initial === false ? undefined : options.initial) ??
					(component ? undefined : options.animate)),
		options.custom
	);
	for (const [key, value] of Object.entries(target)) {
		if (key === 'transition' || key === 'transitionEnd') continue;
		const frame = Array.isArray(value) ? value[immediate ? value.length - 1 : 0] : value;
		if (typeof frame === 'number' || typeof frame === 'string') values[key] = frame;
	}
	for (const [key, value] of Object.entries(target.transitionEnd ?? {})) {
		if (typeof value === 'number' || typeof value === 'string') values[key] = value;
	}
	return values;
}

export function inlineMotionStyle(
	values: ResolvedValues,
	template?: MotionNodeOptions['transformTemplate']
): string {
	const state: HTMLRenderState = { style: {}, vars: {}, transform: {}, transformOrigin: {} };
	buildHTMLStyles(state, values, template);
	return Object.entries({ ...state.style, ...state.vars })
		.map(([key, value]) => `${key.startsWith('--') ? key : camelToDash(key)}:${value}`)
		.join(';');
}

export function initialMotionProps(
	options: MotionOptions,
	render: MotionRenderOptions,
	initial = resolveInitialMotionValues(options, render)
): { style: string; [attribute: string]: unknown } {
	const authored = styleValues(options, false);
	if (render.namespace !== 'svg')
		return { style: inlineMotionStyle({ ...authored, ...initial }, options.transformTemplate) };
	const state = svgRenderState(initial, render.tag, options as MotionNodeOptions);
	const attributes = Object.fromEntries(
		Object.entries(state.attrs).map(([key, value]) => [svgAttributeName(key), value])
	);
	const css = Object.entries({ ...state.style, ...state.vars })
		.map(([key, value]) => `${key.startsWith('--') ? key : camelToDash(key)}:${value}`)
		.join(';');
	return { ...attributes, style: `${inlineMotionStyle(authored)};${css}` };
}
