import { camelToDash, type HTMLVisualElement } from 'motion-dom';

/** Preserve owned inline styles when Svelte recomposes an unrelated style prop.
 * CSSStyleDeclaration reads do not measure layout. Sample only when author props
 * are read, never on an animation frame; leave unrelated application styles out.
 */
export function renderedMotionStyle(node: HTMLElement, visual: HTMLVisualElement): string {
	const { style, vars } = visual.renderState;
	const properties = new Set([...Object.keys(style).map(camelToDash), ...Object.keys(vars)]);
	if (visual.projection)
		for (const key of ['transform', 'transform-origin', 'opacity', 'visibility', 'pointer-events'])
			properties.add(key);
	const declarations: string[] = [];
	for (const key of properties) {
		const value = node.style.getPropertyValue(key);
		if (value)
			declarations.push(
				`${key}:${value}${node.style.getPropertyPriority(key) ? ' !important' : ''}`
			);
	}
	return declarations.join(';');
}
