import {
	applyGeneratorOptions,
	getValueTransition,
	getViewAnimationLayerInfo,
	mapEasingToNativeEasing,
	NativeAnimation,
	NativeAnimationWrapper,
	type AnimationOptions,
	type AnimationPlaybackControls,
	type DOMKeyframesDefinition,
	type NativeAnimationOptions
} from 'motion-dom';
import { isRegisteredView } from './view-registry.js';
import { startManagedViewTransition, type ViewTransactionParticipant } from './view-transitions.js';
import { ViewAnimationGroup, type ViewLayerAnimation } from './view-animation.js';
import type { ViewTransitionHandle, ViewTransitionOptions, ViewUpdate } from './view-types.js';

export type AnimateViewOptions = AnimationOptions &
	Omit<ViewTransitionOptions, 'policy'> & { interrupt?: 'wait' | 'immediate' };
export type AnimateViewTarget = string | Element;
const transformAliases = [
	'x',
	'y',
	'z',
	'translateX',
	'translateY',
	'translateZ',
	'scaleX',
	'scaleY',
	'scaleZ',
	'rotateX',
	'rotateY',
	'rotateZ',
	'skew',
	'skewX',
	'skewY',
	'transformPerspective',
	'originX',
	'originY',
	'originZ'
] as const;
type ElementTransformAlias = (typeof transformAliases)[number];
/** Snapshot layers accept CSS transform/translate/rotate/scale, not element transform aliases. */
export type ViewKeyframes = Omit<DOMKeyframesDefinition, ElementTransformAlias> &
	Partial<Record<ElementTransformAlias, never>>;
const unsupportedTransforms = new Set<string>(transformAliases);
type Kind = 'layout' | 'enter' | 'exit' | 'new' | 'old';
interface Definition {
	keyframes: ViewKeyframes;
	options: AnimationOptions;
}
interface Target {
	subject: AnimateViewTarget;
	pair?: AnimateViewTarget;
	crop?: boolean;
	group?: boolean;
	className?: string;
	definitions: Partial<Record<Kind, Definition>>;
}
interface Capture {
	node: HTMLElement | SVGElement;
	name: string;
	target: Target;
	index: number;
	total: number;
	box: DOMRect;
	radii: string[];
	clips: boolean;
}
const corners = [
	'borderTopLeftRadius',
	'borderTopRightRadius',
	'borderBottomRightRadius',
	'borderBottomLeftRadius'
] as const;
let nextName = 0;

/** Fluent imperative view animation. Configure the chain synchronously before capture begins. */
export class AnimateViewBuilder implements PromiseLike<AnimationPlaybackControls> {
	private targets = new Map<AnimateViewTarget, Target>();
	private current: AnimateViewTarget = 'root';
	private handle: ViewTransitionHandle;
	private controls: AnimationPlaybackControls = new ViewAnimationGroup([]);
	private names = new Map<Element, string>();
	private before = new Map<string, Capture>();
	private after = new Map<string, Capture>();
	private restore: (() => void)[] = [];
	private style?: HTMLStyleElement;
	private captured = false;
	private rootSelected = false;
	private ready: Promise<AnimationPlaybackControls>;

	constructor(
		update: ViewUpdate,
		private options: AnimateViewOptions = {}
	) {
		const participant: ViewTransactionParticipant = {
			owner: Symbol('animateView'),
			exclusive: true,
			ownsRoot: () => this.targets.has('root') || this.rootSelected,
			before: (document) => {
				this.captured = true;
				this.before = this.capture(document, false);
				this.suppressUnselectedRoot(document, this.before);
			},
			after: (document) => {
				this.restoreStyles();
				// A paired source may remain connected. Temporarily release its authored name
				// while the destination owns that same capture name.
				for (const previous of this.before.values()) {
					if (previous.target.pair !== undefined && previous.node.isConnected)
						this.write(previous.node, 'view-transition-name', 'none');
				}
				this.after = this.capture(document, true);
				this.suppressUnselectedRoot(document, this.after);
				this.installStyles(document);
			},
			animate: (document) => {
				this.restoreStyles();
				const layer = this.animate(document);
				this.controls = layer.controls;
				return layer;
			},
			cleanup: () => {
				this.restoreStyles();
				this.style?.remove();
				this.style = undefined;
			}
		};
		this.handle = startManagedViewTransition(
			update,
			{
				...options,
				reducedMotion: options.reducedMotion ?? 'user',
				policy: options.interrupt === 'immediate' ? 'replace' : 'queue'
			},
			participant
		);
		this.ready = this.handle.ready.then(
			() => this.controls,
			async () => {
				// A skipped capture is normal; application exceptions still reject.
				await this.handle.finished;
				return this.controls;
			}
		);
		void this.ready.catch(() => {});
	}

	private target(): Target {
		if (this.captured)
			throw new Error(
				'Astra animateView: finish the fluent chain synchronously before capture begins.'
			);
		let target = this.targets.get(this.current);
		if (!target) {
			target = { subject: this.current, definitions: {} };
			this.targets.set(this.current, target);
		}
		return target;
	}

	/** Select all matching elements; an optional destination pairs old/new elements by order. */
	add(subject: AnimateViewTarget, newSubject?: AnimateViewTarget): this {
		this.current = subject;
		this.target().pair = newSubject;
		return this;
	}
	/** Override aspect-change cropping for the current target. */
	crop(enabled = true): this {
		this.target().crop = enabled;
		return this;
	}
	/** Nest snapshots under their nearest captured ancestor where the browser supports it. */
	group(enabled = true): this {
		this.target().group = enabled;
		return this;
	}
	/** Set a view-transition-class for CSS pseudo-element selectors. */
	class(name: string): this {
		if (!/^[a-zA-Z_][\w-]*$/.test(name))
			throw new TypeError('Astra animateView: class expects one CSS identifier.');
		this.target().className = name;
		return this;
	}
	/** Override native geometry animation timing. add() already enables geometry animation. */
	layout(options: AnimationOptions = {}): this {
		return this.define('layout', {}, options);
	}
	/** Animate only newly entering elements. */
	enter(keyframes: ViewKeyframes, options?: AnimationOptions): this {
		return this.define('enter', keyframes, options);
	}
	/** Animate only departing elements. */
	exit(keyframes: ViewKeyframes, options?: AnimationOptions): this {
		return this.define('exit', keyframes, options);
	}
	/** Animate the new snapshot, including surviving elements. */
	new(keyframes: ViewKeyframes, options?: AnimationOptions): this {
		return this.define('new', keyframes, options);
	}
	/** Animate the old snapshot, including surviving elements. */
	old(keyframes: ViewKeyframes, options?: AnimationOptions): this {
		return this.define('old', keyframes, options);
	}
	private define(kind: Kind, keyframes: ViewKeyframes, options: AnimationOptions = {}): this {
		for (const [name, value] of Object.entries(keyframes)) {
			if (value != null && unsupportedTransforms.has(name)) {
				this.cancel();
				throw new TypeError(
					`Astra animateView: "${name}" is an element transform alias, not a snapshot CSS property. Use transform, translate, rotate or scale with CSS keyframes.`
				);
			}
		}
		this.target().definitions[kind] = { keyframes, options };
		return this;
	}
	/** Resolves after capture to playback controls; await controls.finished for animation completion. */
	then<TResult1 = AnimationPlaybackControls, TResult2 = never>(
		onfulfilled?: ((value: AnimationPlaybackControls) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
	): Promise<TResult1 | TResult2> {
		return this.ready.then(onfulfilled, onrejected);
	}
	/** Cancels the document capture; the application update still runs exactly once. */
	cancel(): void {
		this.handle.cancel();
	}
	/** Additive outcome channel for completion, skipped capture and unsupported browsers. */
	get finished() {
		return this.handle.finished;
	}

	private suppressUnselectedRoot(document: Document, captures: Map<string, Capture>) {
		this.rootSelected = [...captures.values()].some(
			(capture) => capture.node === document.documentElement
		);
		if (!this.targets.has('root') && !this.rootSelected)
			this.write(document.documentElement, 'view-transition-name', 'none');
	}
	private write(node: HTMLElement | SVGElement, property: string, value: string) {
		const previous = node.style.getPropertyValue(property);
		const priority = node.style.getPropertyPriority(property);
		const hadStyle = node.hasAttribute('style');
		node.style.setProperty(property, value, 'important');
		this.restore.push(() => {
			if (
				node.style.getPropertyValue(property) !== value ||
				node.style.getPropertyPriority(property) !== 'important'
			)
				return;
			if (previous) node.style.setProperty(property, previous, priority);
			else node.style.removeProperty(property);
			if (!hadStyle && !node.style.length) node.removeAttribute('style');
		});
	}
	private restoreStyles() {
		for (const restore of this.restore.splice(0).reverse()) restore();
	}
	private capture(document: Document, after: boolean): Map<string, Capture> {
		const captured = new Map<string, Capture>();
		const elements = new Set<Element>();
		for (const target of this.targets.values()) {
			const subject = after && target.pair !== undefined ? target.pair : target.subject;
			const nodes =
				subject === 'root'
					? [document.documentElement]
					: typeof subject === 'string'
						? [...document.querySelectorAll(subject)]
						: [subject];
			const pairs = [...this.before.values()].filter((entry) => entry.target === target);
			const visible = nodes.filter(
				(node) =>
					node.ownerDocument === document && node.isConnected && node.getClientRects().length
			);
			visible.forEach((node, index) => {
				if (elements.has(node))
					throw new Error(
						'Astra animateView: each element must have one fluent target. Combine its methods in one chain.'
					);
				if (isRegisteredView(node))
					throw new Error(
						'Astra animateView: this element belongs to AnimateView. Animate its boundary with startViewTransition, or remove the boundary before using add().'
					);
				elements.add(node);
				const element = node as HTMLElement | SVGElement;
				const computed = document.defaultView!.getComputedStyle(node);
				const authoredName = computed.getPropertyValue('view-transition-name');
				const existing =
					authoredName && !['none', 'auto', 'match-element'].includes(authoredName)
						? authoredName
						: undefined;
				const name =
					subject === 'root'
						? 'root'
						: ((after && target.pair !== undefined ? pairs[index]?.name : undefined) ??
							this.names.get(node) ??
							existing ??
							`astra_fluent_${++nextName}`);
				if (captured.has(name))
					throw new Error(
						`Astra animateView: duplicate view-transition-name ${name}. Give each target a unique name.`
					);
				this.names.set(node, name);
				if (subject !== 'root') {
					this.write(element, 'view-transition-name', name);
					this.write(element, 'view-transition-group', target.group === false ? 'none' : 'contain');
				}
				if (target.className) this.write(element, 'view-transition-class', target.className);
				captured.set(name, {
					node: element,
					name,
					target,
					index,
					total: visible.length,
					box: node.getBoundingClientRect(),
					radii: corners.map((corner) => computed[corner]),
					clips: computed.overflowX !== 'visible' || computed.overflowY !== 'visible'
				});
			});
		}
		return captured;
	}
	private cropped(name: string): boolean {
		const previous = this.before.get(name),
			next = this.after.get(name);
		const target = next?.target ?? previous?.target;
		return (
			name !== 'root' &&
			(target?.crop ??
				!!(
					previous?.box.height &&
					next?.box.height &&
					Math.abs(previous.box.width / previous.box.height - next.box.width / next.box.height) >
						0.2
				))
		);
	}
	private installStyles(document: Document) {
		const style = document.createElement('style');
		style.setAttribute('data-astra-fluent-view', '');
		if (this.options.nonce) style.nonce = this.options.nonce;
		const rules: string[] = [];
		for (const [name, capture] of new Map([...this.before, ...this.after])) {
			const escaped = CSS.escape(name);
			if (this.cropped(name))
				rules.push(
					`::view-transition-group(${escaped}){overflow:clip}::view-transition-old(${escaped}),::view-transition-new(${escaped}){width:100%;height:100%;object-fit:cover}`
				);
			if (capture.clips && capture.target.group !== false)
				rules.push(`::view-transition-group-children(${escaped}){overflow:clip}`);
		}
		style.textContent = rules.join('\n');
		document.head.appendChild(style);
		this.style = style;
	}

	private timing(capture: Capture, kind: Kind, property: string) {
		const base = getValueTransition(this.options, property);
		const override = getValueTransition(capture.target.definitions[kind]?.options, property) ?? {};
		const options = { ...base, ...override };
		if (override.duration !== undefined) {
			if (override.visualDuration === undefined) delete options.visualDuration;
			if (override.type === undefined) delete options.type;
		}
		if (typeof options.delay === 'function')
			options.delay = options.delay(capture.index, capture.total);
		return {
			...options,
			duration: options.duration === undefined ? undefined : options.duration * 1000,
			delay: (options.delay ?? 0) * 1000
		};
	}
	private animate(document: Document): ViewLayerAnimation {
		const animations: AnimationPlaybackControls[] = [];
		const generated = document.getAnimations();
		const explicit = new Set<string>(),
			opacity = new Set<string>();
		const captures = new Map([...this.before, ...this.after]);
		try {
			for (const [name, capture] of captures) {
				for (const side of ['new', 'old'] as const) {
					const sideCapture = side === 'new' ? this.after.get(name) : this.before.get(name);
					if (!sideCapture) continue;
					const exclusive = side === 'new' ? !this.before.has(name) : !this.after.has(name);
					const gated = side === 'new' ? 'enter' : 'exit';
					const definitions = capture.target.definitions;
					const values = {
						...definitions[side]?.keyframes,
						...(exclusive
							? Object.fromEntries(
									Object.entries(definitions[gated]?.keyframes ?? {}).filter(
										([, value]) => value != null
									)
								)
							: {})
					};
					for (const [property, raw] of Object.entries(values)) {
						if (raw == null) continue;
						const kind =
							exclusive &&
							definitions[gated]?.keyframes[property as keyof DOMKeyframesDefinition] != null
								? gated
								: side;
						let keyframes = raw;
						if (!Array.isArray(raw)) {
							const exit =
								kind === 'enter'
									? definitions.exit?.keyframes[property as keyof DOMKeyframesDefinition]
									: undefined;
							const origin =
								exit != null
									? Array.isArray(exit)
										? exit.at(-1)
										: exit
									: property === 'opacity'
										? side === 'new'
											? 0
											: 1
										: property === 'scale' && exclusive
											? side === 'new'
												? 0.85
												: 1
											: undefined;
							if (origin !== undefined) keyframes = [origin, raw];
						}
						animations.push(
							new NativeAnimation({
								...this.timing(sideCapture, kind, property),
								element: document.documentElement,
								name: property,
								pseudoElement: `::view-transition-${side}(${name})`,
								keyframes
							} as NativeAnimationOptions)
						);
						explicit.add(`${name}:${side}`);
						if (property === 'opacity') opacity.add(`${name}:${side}`);
					}
				}
				if (this.cropped(name)) {
					const timing = applyGeneratorOptions(this.timing(capture, 'layout', 'layout'));
					corners.forEach((corner, index) => {
						const from =
							this.before.get(name)?.radii[index] || this.after.get(name)?.radii[index] || '0px';
						const to = this.after.get(name)?.radii[index] || from;
						if (from === '0px' && to === '0px') return;
						animations.push(
							new NativeAnimation({
								element: document.documentElement,
								pseudoElement: `::view-transition-group(${name})`,
								name: corner,
								keyframes: [from, to],
								duration: timing.duration,
								delay: timing.delay,
								ease: timing.ease
							})
						);
					});
				}
			}
			for (const animation of generated) {
				const effect = animation.effect as KeyframeEffect | null;
				const info = effect?.pseudoElement && getViewAnimationLayerInfo(effect.pseudoElement);
				if (!effect || !info || animation.playState === 'finished') continue;
				const capture = captures.get(info.layer);
				if (!capture) continue;
				const opposite = info.type === 'new' ? 'old' : info.type === 'old' ? 'new' : undefined;
				if (explicit.has(`${info.layer}:${info.type}`)) {
					if (!(
						opacity.has(`${info.layer}:new`) &&
						opacity.has(`${info.layer}:old`) &&
						effect.getKeyframes().some((key) => key.mixBlendMode)
					)) {
						animation.cancel();
						continue;
					}
				} else if (
					opposite &&
					explicit.has(`${info.layer}:${opposite}`) &&
					!opacity.has(`${info.layer}:${opposite}`)
				) {
					animation.cancel();
					continue;
				}
				const survivor = this.before.has(info.layer) && this.after.has(info.layer);
				const kind =
					info.type === 'group' || info.type === 'group-children' || survivor
						? 'layout'
						: info.type === 'new'
							? capture.target.definitions.new
								? 'new'
								: 'enter'
							: capture.target.definitions.old
								? 'old'
								: 'exit';
				const resolved = this.timing(capture, kind, kind === 'layout' ? 'layout' : '');
				// The geometry may overshoot after the perceptual spring phase, but
				// the surviving snapshots must finish their opacity handoff on time.
				const visualDuration = resolved.visualDuration;
				const timing = applyGeneratorOptions(resolved);
				const easing =
					survivor && opposite
						? 'linear'
						: mapEasingToNativeEasing(timing.ease, timing.duration ?? 300);
				if (Array.isArray(easing))
					effect.setKeyframes(
						effect
							.getKeyframes()
							.map((key, index) => ({ ...key, easing: easing[index % easing.length] ?? 'linear' }))
					);
				effect.updateTiming({
					duration:
						survivor && opposite && visualDuration !== undefined
							? visualDuration * 1000
							: (timing.duration ?? 300),
					delay: timing.delay,
					easing: Array.isArray(easing) ? 'linear' : easing,
					iterations: (timing.repeat ?? 0) + 1,
					direction: timing.repeatType === 'reverse' ? 'alternate' : 'normal'
				});
				if (timing.autoplay === false) animation.pause();
				animations.push(new NativeAnimationWrapper(animation));
			}
		} catch (error) {
			for (const animation of animations) animation.cancel();
			throw error;
		}
		const controls = new ViewAnimationGroup(animations);
		let resolve!: () => void;
		const cancelled = new Promise<void>((yes) => {
			resolve = yes;
		});
		const finished = Promise.race([controls.finished, cancelled]).then(() => {});
		const stop = controls.stop.bind(controls),
			cancel = controls.cancel.bind(controls);
		controls.stop = () => {
			stop();
			resolve();
		};
		controls.cancel = () => {
			cancel();
			resolve();
		};
		Object.defineProperty(controls, 'finished', { get: () => finished });
		return { controls, finished, cancel: controls.cancel };
	}
}

/**
 * Animate a Svelte DOM update with a fluent chain, coordinated with AnimateView/navigation.
 * @param update State mutation or async update; Svelte rendering settles before the new capture.
 * @param options Default timing (seconds), reduced-motion policy, document, nonce and queue mode.
 * @example const playback = await animateView(() => expanded = true).add('.card').layout({ duration: 0.4 });
 * await playback.finished;
 *
 * Imperative ownership: component removal does not cancel this document-wide transaction.
 * Call builder.cancel() explicitly when the owner wants to skip its capture. Updates still run.
 */
export function animateView(
	update: ViewUpdate,
	options: AnimateViewOptions = {}
): AnimateViewBuilder {
	return new AnimateViewBuilder(update, options);
}
