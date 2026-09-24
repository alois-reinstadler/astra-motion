import { claimMotionOwnership } from './ownership.js';
import { flushSync } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import {
	HTMLProjectionNode,
	HTMLVisualElement,
	addScaleCorrector,
	createBox,
	copyBoxInto,
	createDelta,
	calcBoxDelta,
	applyBoxDelta,
	type Measurements,
	type LayoutUpdateData,
	type DocumentProjectionNode,
	correctBorderRadius,
	correctBoxShadow,
	frame,
	type IProjectionNode,
	type ResolvedValues,
	type MotionStyle,
	type Transition
} from 'motion-dom';
import { observeLayout } from './observe.js';
import {
	ProjectionBoundary,
	observeProjectionScroll,
	correctBoundarySnapshot
} from './projection-boundaries.js';
import { beforeCommit, layoutBridge, synchronousMutation } from './commit.js';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';
import { ensureMotionVisual, hasMotionVisual, hasActiveMotionVisual } from './visual.js';
import { readMotionConfig, observeMotionPreference, observeMotionConfig } from './config.js';

export interface LayoutOptions {
	id?: string;
	mode?: 'both' | 'position' | 'size' | 'preserve-aspect';
	scroll?: boolean;
	root?: boolean;
	/** Values participate in Motion's transform and scale-correction pipeline. */
	style?: {
		rotate?: number;
		scale?: number;
		scaleX?: number;
		scaleY?: number;
		x?: number;
		y?: number;
		borderRadius?: number;
		boxShadow?: string;
	};
}
export interface LayoutGroupOptions extends MotionPolicy {
	/**
	 * Request automatic DOM/size observation (default true). Observation coordinates
	 * registered groups while any group requests it; false is not an isolation boundary.
	 */
	automatic?: boolean;
	/**
	 * Subtree whose mutations can move these participants. Defaults to each element's parent.
	 * Use a getter for a bound element; widen the root to include external reflow sources.
	 * Direct ancestor mutations and ancestor size changes are also observed.
	 */
	observationRoot?: () => Element | null | undefined;
	/** Explicit scope; two controllers without a scope are isolated by object identity. */
	id?: string;
	transition?: Transition;
}

type DOMProjection = InstanceType<typeof HTMLProjectionNode> & Pick<IProjectionNode, 'isPresent'>;
type DocumentProjection = InstanceType<typeof DocumentProjectionNode>;

interface Participant {
	element: HTMLElement;
	projection: DOMProjection;
	visual: HTMLVisualElement;
	policy: LayoutGroupOptions;
	automatic: boolean;
	transition: Transition;
	owner: Set<Participant>;
	exitingRoots: Set<HTMLElement>;
	releaseConfig: () => void;
	update: (config: LayoutOptions, options: LayoutGroupOptions, scope: string) => void;
	dispose: () => void;
}
const participants = new Map<HTMLElement, Participant>();
const pendingMounts = new Map<HTMLElement, (previous?: Participant) => void>();
const pendingRemovals = new Set<Participant>();
const disposedRoots = new Set<IProjectionNode>();
let registrationScheduled = false;
let automaticScheduled = false;
let observer: ReturnType<typeof observeLayout> | undefined;
let scopeSequence = 0;
let transactionDepth = 0;
let correctorsInstalled = false;
let presenceDocument: Document | undefined;
let releasePolicy: (() => void) | undefined;
const defaultTransition: Transition = { type: 'spring', stiffness: 420, damping: 38 };
// Flat layout projection needs no z translation. Avoid forcing a layer per participant.
// Preserve every remaining generated transform, including authored rotation/scale.
const transformTemplate = (_: unknown, generated: string) =>
	generated.replace(/^translate3d\(([^,]+), ([^,]+), 0px\)/, 'translate($1, $2)');

const boundaries = new Map<HTMLElement, ProjectionBoundary>();
function linkProjection(node: IProjectionNode, parent: IProjectionNode) {
	const path = [...parent.path, parent];
	if (
		node.parent === parent &&
		node.path.length === path.length &&
		node.path.every((ancestor, index) => ancestor === path[index])
	)
		return;
	node.parent?.children.delete(node);
	node.parent = parent;
	node.path = path;
	node.depth = path.length;
	parent.children.add(node);
	node.root?.nodes?.remove(node);
	node.root?.nodes?.add(node);
}
function parentProjection(element: HTMLElement): IProjectionNode | undefined {
	const parent = element.parentElement;
	if (!parent) return;
	const ancestor = parentProjection(parent);
	const participant = participants.get(parent);
	if (participant) {
		if (ancestor) linkProjection(participant.projection as IProjectionNode, ancestor);
		return participant.projection as IProjectionNode;
	}
	let boundary = boundaries.get(parent);
	if (!boundary) {
		boundary = new ProjectionBoundary(parent, ancestor);
		boundaries.set(parent, boundary);
	} else if (ancestor) linkProjection(boundary as IProjectionNode, ancestor);
	return boundary as IProjectionNode;
}

function refreshProjectionTree() {
	for (const { element, projection } of participants.values()) {
		const parent = parentProjection(element);
		if (parent) linkProjection(projection as IProjectionNode, parent);
	}
	// Reparenting and late registration can leave empty boundary chains.
	let removed = true;
	while (removed) {
		removed = false;
		for (const [element, boundary] of boundaries) {
			if (boundary.children.size) continue;
			boundary.unmount();
			boundaries.delete(element);
			removed = true;
		}
	}
}

/** Svelte creates child attachments first. Materialize the projection tree parent first. */
function reconcile() {
	const mounts = [...pendingMounts].sort(([a], [b]) =>
		a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
	);
	pendingMounts.clear();
	for (const [element, mount] of mounts) {
		// Keep the projection object: live children retain its parent/path references.
		const previous = participants.get(element);
		mount(previous && pendingRemovals.delete(previous) ? previous : undefined);
	}
	// Shared replacements must be registered before the old member leaves its stack.
	for (const participant of pendingRemovals) participant.dispose();
	pendingRemovals.clear();
	refreshProjectionTree();
	syncObserver();
}

function pruneStack(projection: IProjectionNode, id: string | undefined) {
	if (id && projection.root?.sharedNodes.get(id)?.members.length === 0) {
		projection.root.sharedNodes.delete(id);
	}
}

/** Native transitions own DOM retention; this only informs Motion's shared-stack protocol. */
function setPresence(root: HTMLElement, present: boolean) {
	let changed = false;
	for (const participant of participants.values()) {
		if (participant.element !== root && !root.contains(participant.element)) continue;
		if (present) participant.exitingRoots.delete(root);
		else participant.exitingRoots.add(root);
		const isPresent = participant.exitingRoots.size === 0;
		const { projection } = participant;
		if (projection.isPresent === isPresent) continue;
		changed = true;
		projection.willUpdate();
		projection.isPresent = isPresent;
		if (projection.options.layoutId) {
			if (isPresent) projection.promote();
			else projection.relegate();
		}
	}
	if (changed) scheduleRegistration();
}

const intro = (event: Event) => {
	if (event.target instanceof HTMLElement) setPresence(event.target, true);
};
const outro = (event: Event) => {
	if (event.target instanceof HTMLElement) setPresence(event.target, false);
};

function listenForPresence(document: Document) {
	if (presenceDocument) return;
	presenceDocument = document;
	// Svelte's events do not bubble. Capture also sees non-projecting transition roots.
	document.addEventListener('introstart', intro, true);
	document.addEventListener('outrostart', outro, true);
}

function refreshPolicy(participant: Participant) {
	const reduce = shouldReduceMotion(participant.policy);
	participant.visual.shouldReduceMotion = reduce;
	participant.automatic = participant.policy.automatic ?? true;
	participant.transition = participant.policy.transition ?? defaultTransition;
	participant.projection.setOptions({
		transition: reduce ? { duration: 0 } : participant.transition
	});
	if (reduce) {
		participant.projection.finishAnimation();
		participant.visual.render();
	}
}

/** Update live binding policy without reattaching or resetting authored Motion values. */
function refreshLayoutPolicy(element: HTMLElement) {
	const participant = participants.get(element);
	if (!participant) return;
	const automatic = participant.automatic;
	refreshPolicy(participant);
	// Enabling observation needs a cached box before the first external mutation.
	if (automatic !== participant.automatic) scheduleRegistration();
}

function syncObserver() {
	if (participants.size && !releasePolicy) {
		releasePolicy = observeMotionPreference(() => {
			for (const participant of participants.values()) refreshPolicy(participant);
			syncObserver();
		});
	} else if (!participants.size) {
		releasePolicy?.();
		releasePolicy = undefined;
	}
	const automatic = [...participants.values()].some((participant) => participant.automatic);
	if (!automatic) {
		observer?.disconnect();
		observer = undefined;
		return;
	}
	if (!observer) observer = observeLayout(document, scheduleAutomatic);
	for (const { element, policy } of participants.values()) {
		observer.add(element, () => policy.observationRoot?.());
	}
}

let observerSyncScheduled = false;
function scheduleObserverSync() {
	if (observerSyncScheduled) return;
	observerSyncScheduled = true;
	queueMicrotask(() => {
		observerSyncScheduled = false;
		syncObserver();
	});
}

function seedCachedSnapshots(affected: Iterable<Participant> = participants.values()) {
	const selected = [...affected];
	const snapshots = new Map<DOMProjection, Measurements>();
	for (const { projection: node } of selected) {
		if (!node.layout || node.snapshot) continue;
		const layoutBox = createBox();
		copyBoxInto(layoutBox, node.target ?? node.layout.layoutBox);
		// Keep fractional measured dimensions: WebKit rounds Motion's logical layout boxes.
		const measuredBox = node.removeElementScroll(node.layout.measuredBox);
		const delta = createDelta();
		calcBoxDelta(delta, node.layout.layoutBox, layoutBox);
		applyBoxDelta(measuredBox, delta);
		snapshots.set(node, {
			...node.layout,
			layoutBox,
			measuredBox,
			latestValues: { ...node.latestValues }
		});
	}
	// First undo the cached scroll above, then apply current scroll for shared source capture.
	const scrollNodes = new Set<IProjectionNode>();
	for (const { projection } of selected) {
		for (const ancestor of projection.path) scrollNodes.add(ancestor);
	}
	for (const ancestor of scrollNodes) ancestor.updateScroll('snapshot');
	for (const [node, saved] of snapshots) saved.measuredBox = node.applyTransform(saved.measuredBox);
	for (const [node, saved] of snapshots) node.snapshot = saved;
}

function automaticCommit(affected?: Set<Participant>) {
	if (!observer || transactionDepth) return;
	transactionDepth++;
	try {
		// Preserve removed shared sources before Svelte's replacement registrations reconcile.
		seedCachedSnapshots(affected);
		snapshot(affected);
	} finally {
		transactionDepth--;
		commit(true);
		observer?.acknowledge();
	}
}

const dirtyElements = new Set<HTMLElement>();
function scheduleAutomatic(elements: Set<HTMLElement>) {
	for (const element of elements) dirtyElements.add(element);
	if (automaticScheduled || transactionDepth) return;
	automaticScheduled = true;
	queueMicrotask(() => {
		automaticScheduled = false;
		const affected = new Set<Participant>();
		for (const element of dirtyElements) {
			const participant = participants.get(element);
			if (participant) affected.add(participant);
		}
		dirtyElements.clear();
		// Nested projection and shared stacks must measure together even across roots.
		const byProjection = new Map<IProjectionNode, Participant>();
		const shared = new Map<string, Participant[]>();
		for (const participant of participants.values()) {
			byProjection.set(participant.projection as IProjectionNode, participant);
			const id = participant.projection.options.layoutId;
			if (id !== undefined) {
				if (!shared.has(id)) shared.set(id, []);
				shared.get(id)!.push(participant);
			}
		}
		const sharedVisited = new Set<string>();
		for (const participant of affected) {
			const projection = participant.projection;
			const children = [...projection.children];
			for (const child of children) {
				if (child instanceof ProjectionBoundary) children.push(...child.children);
			}
			for (const relative of [...projection.path, ...children]) {
				const connected = byProjection.get(relative);
				if (connected) affected.add(connected);
			}
			const id = projection.options.layoutId;
			if (id !== undefined && !sharedVisited.has(id)) {
				sharedVisited.add(id);
				for (const member of shared.get(id) ?? []) affected.add(member);
			}
		}
		if (affected.size) automaticCommit(affected);
	});
}

function scheduleRegistration() {
	if (transactionDepth || registrationScheduled) return;
	registrationScheduled = true;
	queueMicrotask(() => {
		registrationScheduled = false;
		if (observer) seedCachedSnapshots();
		reconcile();
		if (observer) automaticCommit();
		else commit();
	});
}

function snapshot(affected?: Set<Participant>) {
	reconcile();
	for (const boundary of boundaries.values()) boundary.captureOffset();
	for (const capture of beforeCommit) capture();
	for (const participant of affected ?? participants.values()) {
		const reduce = shouldReduceMotion(participant.policy);
		participant.visual.shouldReduceMotion = reduce;
		participant.projection.setOptions({
			transition: reduce ? { duration: 0 } : participant.transition
		});
		participant.projection.willUpdate();
	}
}

function commit(immediate = false) {
	const roots = new Set(disposedRoots);
	disposedRoots.clear();
	for (const { projection } of participants.values()) {
		if (projection.root) roots.add(projection.root);
	}
	for (const root of roots) {
		if (immediate) (root as DocumentProjection).update();
		else root.didUpdate();
	}
}

/**
 * A synchronous layout transaction. Load async data before entering this callback.
 * All registered groups are snapshotted so cross-component reflow stays coordinated.
 */
export function updateLayout<Result>(
	change: (() => Result) & (Result extends PromiseLike<unknown> ? never : unknown)
): void {
	const apply = synchronousMutation(change);
	if (typeof window === 'undefined') {
		apply();
		return;
	}
	if (transactionDepth) {
		apply();
		return;
	}
	transactionDepth++;
	try {
		snapshot();
		flushSync(apply);
	} finally {
		try {
			reconcile();
		} finally {
			transactionDepth--;
			commit();
			observer?.acknowledge();
		}
	}
}

/**
 * Native-element attachments + automatic postcommit projection. Safe to create during SSR.
 * The element's transform is owned by Motion for the attachment's entire lifetime.
 * Plain 2D transformed and sticky ancestors are included in the measurement tree.
 * Competing transforms on participants and 3D/perspective projection are unsupported.
 */
export function createLayout(options: LayoutGroupOptions = {}) {
	const own = options;
	const defaults = readMotionConfig();
	options = {
		...own,
		get transition() {
			return own.transition ?? defaults().layoutTransition ?? defaults().transition;
		},
		get reducedMotion() {
			return own.reducedMotion ?? defaults().reducedMotion;
		},
		get automatic() {
			return own.automatic ?? defaults().automatic;
		}
	};
	if (layoutBridge.update !== updateLayout) {
		layoutBridge.update = updateLayout;
		layoutBridge.schedule = (flush) => frame.read(flush, false, true);
		layoutBridge.refreshPolicy = refreshLayoutPolicy;
	}
	const scope = options.id === undefined ? `instance:${++scopeSequence}` : `named:${options.id}`;
	const members = new Set<Participant>();
	function layout(config: LayoutOptions = {}): Attachment<HTMLElement> {
		return (element) => {
			if (
				pendingMounts.has(element) ||
				(participants.has(element) && !pendingRemovals.has(participants.get(element)!))
			)
				throw new Error('Astra motion: one layout attachment per element.');
			const releaseOwnership = claimMotionOwnership(element, 'layout', element);
			let participant: Participant | undefined;
			const mount = (previous?: Participant) => {
				if (previous) {
					previous.owner.delete(previous);
					previous.owner = members;
					members.add(previous);
					previous.update(config, options, scope);
					previous.releaseConfig();
					previous.releaseConfig = observeMotionConfig(defaults, () => {
						refreshPolicy(previous);
						scheduleObserverSync();
					});
					participant = previous;
					return;
				}
				const computed = getComputedStyle(element);
				if (
					(computed.transform !== 'none' && !hasMotionVisual(element)) ||
					computed.translate !== 'none' ||
					computed.rotate !== 'none' ||
					computed.scale !== 'none'
				) {
					throw new Error(
						'Astra motion: CSS transforms on a layout node must move to layout({ style: { rotate, scale, x, y } }). The existing transform was left intact.'
					);
				}
				if (!correctorsInstalled) {
					addScaleCorrector({
						borderRadius: {
							...correctBorderRadius,
							applyTo: [
								'borderTopLeftRadius',
								'borderTopRightRadius',
								'borderBottomLeftRadius',
								'borderBottomRightRadius'
							]
						},
						boxShadow: correctBoxShadow
					});
					correctorsInstalled = true;
				}
				const original = new Map<string, { value: string; priority: string }>();
				for (const property of [
					'transform',
					'transform-origin',
					'opacity',
					'visibility',
					'pointer-events',
					'border-radius',
					'border-top-left-radius',
					'border-top-right-radius',
					'border-bottom-left-radius',
					'border-bottom-right-radius',
					'box-shadow'
				])
					original.set(property, {
						value: element.style.getPropertyValue(property),
						priority: element.style.getPropertyPriority(property)
					});
				const motionVisual = ensureMotionVisual(element);
				const latestValues: ResolvedValues = motionVisual?.latestValues ?? { ...config.style };
				const transition = options.transition ?? defaultTransition;
				const props = {
					...motionVisual?.getProps(),
					layout: true,
					style: {
						...(motionVisual?.getProps() as { style?: MotionStyle })?.style,
						...config.style
					},
					transition,
					transformTemplate
				};
				const visual =
					motionVisual ??
					new HTMLVisualElement(
						{
							props,
							presenceContext: null,
							reducedMotionConfig: options.reducedMotion ?? 'user',
							visualState: {
								latestValues,
								renderState: { style: {}, transform: {}, transformOrigin: {}, vars: {} }
							}
						},
						{ allowProjection: true }
					);
				if (motionVisual) visual.update(props, null);
				const projection: DOMProjection = new HTMLProjectionNode(
					latestValues,
					parentProjection(element)
				);
				observeProjectionScroll(projection, element);
				visual.projection = projection;
				projection.setOptions({
					layout: true,
					layoutId: config.id === undefined ? undefined : JSON.stringify([scope, config.id]),
					animationType: config.mode ?? 'both',
					visualElement: visual,
					crossfade: true,
					layoutScroll: config.scroll,
					layoutRoot: config.root,
					transition: shouldReduceMotion(options) ? { duration: 0 } : transition
				});
				projection.isPresent = true;
				// Measurement resets the DOM transform. Same-frame commits can hit Motion's
				// VisualElement timestamp deduplication, so enqueue restoration directly.
				// Motion's render queue still deduplicates this by callback identity.
				projection.addEventListener('measure', () => {
					correctBoundarySnapshot(projection as IProjectionNode);
					frame.render(visual.render, false, true);
				});
				// Motion 13.2.0 releases a detached shared source before resolving its target.
				// Normalize the delta into that target's logical scroll space first. Register
				// before mount: Motion installs its animation-start listener inside mount.
				projection.addEventListener('didUpdate', ({ snapshot, delta }: LayoutUpdateData) => {
					if (
						!projection.layout ||
						!projection.resumeFrom ||
						projection.resumeFrom.instance ||
						snapshot.source === projection.layout.source
					)
						return;
					calcBoxDelta(
						delta,
						projection.applyTransform(
							projection.removeElementScroll(projection.layout.measuredBox),
							true
						),
						projection.removeElementScroll(snapshot.measuredBox)
					);
				});
				projection.mount(element);
				let authoredStyle = { ...config.style };
				const update = (next: LayoutOptions, policy: LayoutGroupOptions, namespace: string) => {
					const id = next.id === undefined ? undefined : JSON.stringify([namespace, next.id]);
					const previousId = projection.options.layoutId;
					if (id !== previousId) {
						if (projection.isLead()) projection.finishAnimation();
						else projection.currentAnimation = undefined; // Borrowed from the surviving lead.
						projection.getStack()?.remove(projection as IProjectionNode);
						pruneStack(projection as IProjectionNode, previousId);
						projection.resumeFrom = projection.resumingFrom = undefined;
					}
					registered.policy = policy;
					registered.automatic = policy.automatic ?? true;
					registered.transition = policy.transition ?? defaultTransition;
					visual.shouldReduceMotion = shouldReduceMotion(policy);
					projection.setOptions({
						layoutId: id,
						animationType: next.mode ?? 'both',
						layoutScroll: next.scroll,
						layoutRoot: next.root,
						transition: visual.shouldReduceMotion ? { duration: 0 } : registered.transition
					});
					const nextStyle = next.style ?? {};
					const nextProps = {
						...visual.getProps(),
						layout: true,
						style: {
							...(hasMotionVisual(element)
								? (visual.getProps() as { style?: MotionStyle }).style
								: {}),
							...nextStyle
						},
						transition: registered.transition,
						transformTemplate
					};
					visual.update(nextProps, null);
					for (const key of Object.keys(authoredStyle)) {
						if (key in nextStyle) continue;
						visual.removeValue(key);
						const cssProperties =
							key === 'borderRadius'
								? [
										'border-radius',
										'border-top-left-radius',
										'border-top-right-radius',
										'border-bottom-left-radius',
										'border-bottom-right-radius'
									]
								: key === 'boxShadow'
									? ['box-shadow']
									: [];
						for (const property of cssProperties) {
							const saved = original.get(property)!;
							if (saved.value) element.style.setProperty(property, saved.value, saved.priority);
							else element.style.removeProperty(property);
						}
					}
					for (const [key, value] of Object.entries(nextStyle)) {
						visual.latestValues[key] = value;
						visual.getValue(key)?.jump(value);
					}
					authoredStyle = { ...nextStyle };
					if (id !== previousId && id)
						projection.root?.registerSharedNode(id, projection as IProjectionNode);
					visual.render();
				};
				const dispose = () => {
					if (projection.root) disposedRoots.add(projection.root);
					registered.owner.delete(registered);
					registered.releaseConfig();
					participants.delete(element);
					observer?.remove(element);
					if (!participants.size) {
						presenceDocument?.removeEventListener('introstart', intro, true);
						presenceDocument?.removeEventListener('outrostart', outro, true);
						presenceDocument = undefined;
					}
					// A shared follow node may refer to the surviving lead's animation.
					if (!projection.getStack() || projection.isLead()) projection.finishAnimation();
					const keepVisual = hasActiveMotionVisual(element);
					if (keepVisual) {
						projection.unmount();
						visual.projection = undefined;
					} else visual.unmount();
					pruneStack(projection as IProjectionNode, projection.options.layoutId);
					// reconcile() commits disposal. Motion's fallback postRender check can
					// otherwise clear snapshots belonging to a newer transaction.
					for (const [property, { value, priority }] of original) {
						if (value) element.style.setProperty(property, value, priority);
						else element.style.removeProperty(property);
					}
					if (keepVisual) visual.render();
				};
				const registered: Participant = {
					element,
					projection,
					visual,
					policy: options,
					automatic: options.automatic ?? true,
					transition,
					owner: members,
					exitingRoots: new Set(),
					releaseConfig: () => {},
					update,
					dispose
				};
				registered.releaseConfig = observeMotionConfig(defaults, () => {
					refreshPolicy(registered);
					scheduleObserverSync();
				});
				participant = registered;
				participants.set(element, registered);
				members.add(registered);
				listenForPresence(element.ownerDocument);
				visual.render();
			};
			pendingMounts.set(element, mount);
			scheduleRegistration();
			let released = false;
			return () => {
				if (released) return;
				released = true;
				if (pendingMounts.get(element) === mount) pendingMounts.delete(element);
				if (participant) pendingRemovals.add(participant);
				scheduleRegistration();
				queueMicrotask(releaseOwnership);
			};
		};
	}
	layout.update = updateLayout;
	layout.stats = () => ({
		participants: members.size,
		active: [...members].filter(({ projection }) => projection.currentAnimation).length
	});
	return layout;
}
export type LayoutController = ReturnType<typeof createLayout>;

// Replacing the projection runtime invalidates its live trees. Component edits
// still use Svelte HMR; engine edits explicitly reload rather than reuse stale owners.
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());
