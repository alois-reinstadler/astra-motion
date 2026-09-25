import {
	HTMLVisualElement,
	visualElementStore,
	buildHTMLStyles,
	camelToDash,
	transformProps,
	isAnimationControls,
	type MotionNodeOptions,
	type MotionStyle,
	type ResolvedValues,
	type TargetAndTransition,
	type VisualElement
} from 'motion-dom';
import {
	ensureMotionAnimationState,
	cancelMotionSequence,
	setMotionAnimationGuard
} from './animation.js';
import { prepareMotionHandoff } from './motion-compat.js';
import { resolveMotionTarget } from './targets.js';

/** One state/projection value owner per native element. Kept private to the adapter. */
interface MotionVisualRecord {
	visual?: HTMLVisualElement;
	active: boolean;
	initial: ResolvedValues;
	props: () => MotionNodeOptions;
	reduced: () => 'user' | 'always' | 'never';
	canAnimate: () => boolean;
	parent?: () => HTMLElement | undefined;
	original: Map<string, { value: string; priority: string }>;
	transformOwned?: boolean;
}
const records = new Map<HTMLElement, MotionVisualRecord>();

export function hasMotionVisual(node: HTMLElement) {
	return records.has(node);
}
export function hasActiveMotionVisual(node: HTMLElement) {
	return records.get(node)?.active === true;
}

/** Paint-only bindings leave authored transforms alone, until a transform is actually requested. */
export function assertMotionTransformOwnership(
	node: HTMLElement,
	props?: MotionNodeOptions & { style?: MotionStyle },
	additional?: TargetAndTransition
) {
	const record = records.get(node);
	if (!record || record.transformOwned) return;
	props ??= record.props();
	const transforms = (values: object | undefined) =>
		Object.entries(values ?? {}).some(
			([key, value]) => value != null && (key === 'transform' || transformProps.has(key))
		);
	const definitions = [
		props.initial === false ? undefined : props.initial,
		props.animate,
		props.exit,
		props.whileHover,
		props.whileTap,
		props.whileFocus,
		props.whileDrag,
		props.whileInView
	];
	const needsTransform =
		props.layout ||
		props.drag ||
		transforms(props.style) ||
		transforms(record.initial) ||
		transforms(record.visual?.latestValues) ||
		transforms(additional) ||
		transforms(additional?.transitionEnd) ||
		definitions.some((definition) => {
			if (typeof definition === 'boolean' || isAnimationControls(definition)) return false;
			const target = resolveMotionTarget(props!, definition, props!.custom, record.visual);
			return transforms(target) || transforms(target.transitionEnd);
		});
	if (!needsTransform) return;
	const expected = { style: {}, vars: {}, transform: {}, transformOrigin: {} };
	buildHTMLStyles(expected, record.initial);
	const authoredTransform =
		record.visual?.renderState.style.transform ??
		(expected.style as { transform?: string }).transform;
	const computed = getComputedStyle(node);
	if (
		(computed.transform !== 'none' && node.style.transform !== authoredTransform) ||
		computed.translate !== 'none' ||
		computed.rotate !== 'none' ||
		computed.scale !== 'none'
	) {
		throw new Error(
			'Astra motion: move CSS transform/translate/rotate/scale into the binding style/targets (x, y, rotate, scale), or put it on an outer element. Motion owns this element’s transform.'
		);
	}
	record.transformOwned = true;
}

export function ensureMotionVisual(node: HTMLElement): HTMLVisualElement | undefined {
	const record = records.get(node);
	if (!record) return undefined;
	assertMotionTransformOwnership(node);
	if (record.visual) return record.visual;
	let parent: HTMLVisualElement | undefined;
	const declaredParent = record.parent?.();
	if (record.parent) {
		if (!declaredParent || !declaredParent.contains(node))
			throw new Error(
				'Astra motion: binding.child() must attach inside its parent binding element.'
			);
		parent = ensureMotionVisual(declaredParent);
	}
	for (
		let ancestor = record.parent ? null : node.parentElement;
		ancestor;
		ancestor = ancestor.parentElement
	) {
		parent =
			ensureMotionVisual(ancestor) ??
			(visualElementStore.get(ancestor) as HTMLVisualElement | undefined);
		if (parent) break;
	}
	const visual = new HTMLVisualElement(
		{
			parent,
			props: record.props(),
			presenceContext: null,
			reducedMotionConfig: record.reduced(),
			visualState: {
				latestValues: { ...record.initial },
				renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
			}
		},
		{ allowProjection: true }
	);
	// Attachments materialize parents first, so Motion's React-oriented mount heuristic
	// otherwise treats every child as a late mount and replays initial=false keyframes.
	if (record.props().initial === false) visual.manuallyAnimateOnMount = false;
	record.visual = visual;
	visual.mount(node);
	setMotionAnimationGuard(visual, (target) => {
		assertMotionTransformOwnership(node, record.props(), target);
	});
	return visual;
}

export function registerMotionVisual(
	node: HTMLElement,
	initial: ResolvedValues,
	props: () => MotionNodeOptions,
	reduced: () => 'user' | 'always' | 'never',
	canAnimate: () => boolean,
	parent?: () => HTMLElement | undefined
) {
	let record = records.get(node);
	if (record?.active) throw new Error('Astra motion: one motion binding per native element.');
	if (record) Object.assign(record, { active: true, initial, props, reduced, canAnimate, parent });
	else {
		const original = new Map(
			Array.from(node.style, (key) => [
				key,
				{ value: node.style.getPropertyValue(key), priority: node.style.getPropertyPriority(key) }
			])
		);
		record = { active: true, initial, props, reduced, canAnimate, parent, original };
		records.set(node, record);
	}
	const owned = record;
	return () => {
		owned.active = false;
		queueMicrotask(() => {
			if (owned.active) return;
			if (owned.visual) cancelMotionSequence(owned.visual);
			owned.visual?.values.forEach((value) => prepareMotionHandoff(value.animation));
			if (owned.visual?.current) owned.visual.unmount();
			if (owned.visual) {
				const state = owned.visual.renderState;
				for (const key of [...Object.keys(state.style), ...Object.keys(state.vars)]) {
					const css = key.startsWith('--') ? key : camelToDash(key);
					const saved = owned.original.get(css);
					if (saved) node.style.setProperty(css, saved.value, saved.priority);
					else node.style.removeProperty(css);
				}
			}
			if (records.get(node) === owned) records.delete(node);
		});
	};
}

const pending = new Map<VisualElement, boolean>();
let scheduled = false;
/** Resolve inherited state children-first after all Svelte bindings have committed their props. */
export function scheduleMotionState(visual: VisualElement, force = false) {
	pending.set(visual, force || pending.get(visual) === true);
	if (scheduled) return;
	scheduled = true;
	queueMicrotask(() => {
		scheduled = false;
		const ordered = new Set<VisualElement>();
		function collect(node: VisualElement) {
			if (ordered.has(node)) return;
			node.variantChildren?.forEach(collect);
			ordered.add(node);
		}
		const requested = new Map(pending);
		requested.forEach((_, node) => collect(node));
		pending.clear();
		for (const node of ordered) {
			const record = node.current instanceof HTMLElement ? records.get(node.current) : undefined;
			if (!record?.active || !record.canAnimate()) continue;
			void ensureMotionAnimationState(node).animateChanges(
				requested.get(node) ? 'animate' : undefined
			);
		}
	});
}
