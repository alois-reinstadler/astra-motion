import {
	HTMLVisualElement,
	SVGVisualElement,
	visualElementStore,
	camelToDash,
	type MotionNodeOptions,
	type ResolvedValues,
	type VisualElement
} from 'motion-dom';
import { ensureMotionAnimationState, cancelMotionSequence } from './animation.js';
import { prepareMotionHandoff } from './motion-compat.js';
import { isSVGElement, type MotionElement, type MotionVisual } from './motion-types.js';
import { createSVGRenderState, svgAttributeName } from './svg.js';

/** One state/projection value owner per native element. Kept private to the adapter. */
interface MotionVisualRecord {
	visual?: MotionVisual;
	active: boolean;
	initial: ResolvedValues;
	props: () => MotionNodeOptions;
	reduced: () => 'user' | 'always' | 'never';
	canAnimate: () => boolean;
	parent?: () => MotionElement | undefined;
	original: Map<string, { value: string; priority: string }>;
	originalAttributes?: Map<string, string>;
	removeAdoptedVariant?: () => void;
}
const records = new Map<MotionElement, MotionVisualRecord>();

/** Deferred feature parents can materialize after already-mounted eager descendants. */
function adoptVisual(record: MotionVisualRecord, parent: MotionVisual | undefined) {
	const visual = record.visual;
	if (!visual || visual.parent === parent) return;
	record.removeAdoptedVariant?.();
	record.removeAdoptedVariant = undefined;
	visual.parent?.getClosestVariantNode()?.variantChildren?.delete(visual);
	visual.parent?.removeChild(visual);
	visual.parent = parent;
	const updateDepth = (node: VisualElement, depth: number) => {
		node.depth = depth;
		node.children.forEach((child) => updateDepth(child, depth + 1));
	};
	updateDepth(visual, parent ? parent.depth + 1 : 0);
	parent?.addChild(visual);
	if (parent && visual.isVariantNode && !visual.isControllingVariants)
		record.removeAdoptedVariant = parent.addVariantChild(visual);
}

export function hasMotionVisual(node: MotionElement) {
	return records.has(node);
}
/** Read author configuration independently of projection's temporary visual props. */
export function getMotionVisualProps(node: MotionElement): MotionNodeOptions | undefined {
	return records.get(node)?.props();
}
export function hasActiveMotionVisual(node: MotionElement) {
	return records.get(node)?.active === true;
}

export function ensureMotionVisual(node: HTMLElement): HTMLVisualElement | undefined;
export function ensureMotionVisual(node: SVGElement): SVGVisualElement | undefined;
export function ensureMotionVisual(node: MotionElement): MotionVisual | undefined;
export function ensureMotionVisual(node: MotionElement): MotionVisual | undefined {
	const record = records.get(node);
	if (!record) return undefined;
	if (record.visual) return record.visual;
	let parent: MotionVisual | undefined;
	const declaredParent = record.parent?.();
	if (record.parent) {
		if (!declaredParent)
			throw new Error('Astra motion: binding.child() requires its parent binding to be attached.');
		// Declared variant ancestry survives portals; projection measures DOM ancestry separately.
		parent = ensureMotionVisual(declaredParent);
	}
	for (
		let ancestor = record.parent ? null : node.parentElement;
		ancestor;
		ancestor = ancestor.parentElement
	) {
		parent =
			ensureMotionVisual(ancestor) ??
			(visualElementStore.get(ancestor) as MotionVisual | undefined);
		if (parent) break;
	}
	const options = {
		parent,
		props: record.props(),
		presenceContext: null,
		reducedMotionConfig: record.reduced(),
		visualState: {
			latestValues: { ...record.initial },
			renderState: createSVGRenderState()
		}
	};
	const visual = isSVGElement(node)
		? new SVGVisualElement(options, { allowProjection: false })
		: new HTMLVisualElement(options, { allowProjection: true });

	// Attachments materialize parents first, so Motion's React-oriented mount heuristic
	// otherwise treats every child as a late mount and replays initial=false keyframes.
	if (record.props().initial === false) visual.manuallyAnimateOnMount = false;
	record.visual = visual;
	if (isSVGElement(node)) (visual as SVGVisualElement).mount(node);
	else (visual as HTMLVisualElement).mount(node);
	for (const [childNode, child] of records) {
		if (childNode !== node && child.active && child.parent?.() === node) adoptVisual(child, visual);
	}
	return visual;
}

export function registerMotionVisual(
	node: MotionElement,
	initial: ResolvedValues,
	props: () => MotionNodeOptions,
	reduced: () => 'user' | 'always' | 'never',
	canAnimate: () => boolean,
	parent?: () => MotionElement | undefined
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
		record = {
			active: true,
			initial,
			props,
			reduced,
			canAnimate,
			parent,
			original,
			originalAttributes: isSVGElement(node)
				? new Map(Array.from(node.attributes, (attr) => [attr.name, attr.value]))
				: undefined
		};
		records.set(node, record);
	}
	const owned = record;
	return () => {
		owned.active = false;
		queueMicrotask(() => {
			if (owned.active) return;
			owned.removeAdoptedVariant?.();
			for (const child of records.values()) {
				if (child !== owned && child.active && child.visual?.parent === owned.visual)
					adoptVisual(child, undefined);
			}
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
			if (owned.visual?.type === 'svg') {
				for (const key of Object.keys((owned.visual as SVGVisualElement).renderState.attrs)) {
					const name = svgAttributeName(key);
					const original = owned.originalAttributes?.get(name);
					if (original === undefined) node.removeAttribute(name);
					else node.setAttribute(name, original);
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
			const record =
				node.current instanceof Element ? records.get(node.current as MotionElement) : undefined;
			if (!record?.active || !record.canAnimate()) continue;
			void ensureMotionAnimationState(node).animateChanges(
				requested.get(node) ? 'animate' : undefined
			);
		}
	});
}
