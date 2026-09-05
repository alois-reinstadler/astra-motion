import {
	resolveVariantFromProps,
	resolveTransition,
	getValueTransition,
	type AnimationDefinition,
	type MotionNodeOptions,
	type TargetAndTransition,
	type Transition,
	type VisualElement
} from 'motion-dom';

/** The same last-label-wins target contract is used on the server, in presence and live state. */
export function resolveMotionTarget(
	props: MotionNodeOptions,
	definition: AnimationDefinition | undefined,
	custom?: unknown,
	visual?: VisualElement
): TargetAndTransition {
	if (definition === undefined) return {};
	if (!Array.isArray(definition))
		return resolveVariantFromProps(props, definition, custom, visual) ?? {};
	const target: TargetAndTransition = {};
	const end: NonNullable<TargetAndTransition['transitionEnd']> = {};
	let transition: Transition = props.transition ?? {};
	const properties: Record<string, ReturnType<typeof getValueTransition>> = {};
	for (const label of definition) {
		const resolved = resolveVariantFromProps(props, label, custom, visual);
		if (!resolved) continue;
		const { transition: specified, transitionEnd = {}, ...values } = resolved;
		const ownTransition = resolveTransition(specified, props.transition) ?? props.transition ?? {};
		transition = { ...transition, ...specified };
		for (const key of Object.keys(values)) {
			delete end[key];
			properties[key] = getValueTransition(ownTransition, key);
		}
		Object.assign(target, values);
		Object.assign(end, transitionEnd);
	}
	return { ...target, transition: { ...transition, ...properties }, transitionEnd: end };
}
