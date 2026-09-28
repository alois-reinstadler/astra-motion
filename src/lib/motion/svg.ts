import {
	buildSVGAttrs,
	camelCaseAttributes,
	camelToDash,
	isMotionValue,
	type ResolvedValues,
	type SVGRenderState,
	type MotionStyle,
	type MotionNodeOptions
} from 'motion-dom';

/** Tags shared with HTML are resolved from the surrounding motion SVG context. */
export function isSVGComponentTag(tag: string | undefined): boolean {
	return Boolean(
		tag &&
		!tag.includes('-') &&
		(/[A-Z]/u.test(tag) ||
			new Set([
				'svg',
				'animate',
				'circle',
				'clippath',
				'defs',
				'desc',
				'ellipse',
				'filter',
				'g',
				'image',
				'line',
				'marker',
				'mask',
				'metadata',
				'mpath',
				'path',
				'pattern',
				'polygon',
				'polyline',
				'rect',
				'set',
				'stop',
				'switch',
				'symbol',
				'text',
				'textpath',
				'tspan',
				'use',
				'view'
			]).has(tag))
	);
}

export function createSVGRenderState(): SVGRenderState {
	return { style: {}, vars: {}, transform: {}, transformOrigin: {}, attrs: {} };
}

export function svgAttributeName(key: string): string {
	return camelCaseAttributes.has(key) ? key : camelToDash(key);
}

export function svgMotionValues(attributes: Record<string, unknown>): ResolvedValues {
	const values: ResolvedValues = {};
	for (const [key, value] of Object.entries(attributes)) {
		if (
			['attrX', 'attrY', 'attrScale'].includes(key) &&
			(typeof value === 'number' || typeof value === 'string')
		) {
			values[key] = value;
			continue;
		}
		if (!isMotionValue(value)) continue;
		const name = ['x', 'y', 'scale'].includes(key)
			? `attr${key[0].toUpperCase()}${key.slice(1)}`
			: key;
		values[name] = value.get();
	}
	return values;
}

/** Plain native attributes remain native; the visual subscribes to attribute MotionValues. */
export function nativeSVGProps(attributes: Record<string, unknown>) {
	return Object.fromEntries(
		Reflect.ownKeys(attributes).map((key) => {
			const value = attributes[key as string];
			const name =
				key === 'attrX' ? 'x' : key === 'attrY' ? 'y' : key === 'attrScale' ? 'scale' : key;
			return [name, isMotionValue(value) ? value.get() : value];
		})
	);
}

export function svgRenderState(
	values: ResolvedValues,
	tag: string | undefined,
	props: MotionNodeOptions & { style?: MotionStyle }
) {
	const state = createSVGRenderState();
	buildSVGAttrs(state, values, tag === 'svg', props.transformTemplate, props.style);
	return state;
}
