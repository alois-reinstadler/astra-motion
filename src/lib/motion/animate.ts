import {
	animate as motionAnimate,
	visualElementStore,
	cancelFrame,
	transformProps,
	type AnimationOptions,
	type AnimationPlaybackControlsWithThen,
	type DOMKeyframesDefinition,
	type SequenceOptions,
	type SequenceLabel,
	type SequenceLabelWithTime,
	type SegmentTransitionOptions
} from 'motion';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { readMotionConfig, observeMotionConfig, observeMotionPreference } from './config.js';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';
import { claimMotionOwnership } from './ownership.js';
import { prepareMotionHandoff } from './motion-compat.js';

export type ScopedTarget = string | Element | Iterable<Element>;
export type ScopedSequence = (
	| SequenceLabel
	| SequenceLabelWithTime
	| [ScopedTarget, DOMKeyframesDefinition, SegmentTransitionOptions?]
)[];
export interface AnimateScope {
	attach: Attachment<Element>;
	/** Selectors only resolve descendants of the attached root. Pass the root directly to animate it. */
	animate(
		target: ScopedTarget,
		keyframes: DOMKeyframesDefinition,
		options?: AnimationOptions
	): AnimationPlaybackControlsWithThen;
	sequence(sequence: ScopedSequence, options?: SequenceOptions): AnimationPlaybackControlsWithThen;
	/** Stop every owned playback at its current pose. A stopped scope can be used again. */
	stop(): void;
	readonly current: Element | undefined;
	readonly active: number;
}

const transforms = (keyframes: object) =>
	Object.keys(keyframes).some(
		(key) => key === 'transform' || key === 'translate' || transformProps.has(key)
	);

/** Native elements, Motion's public timeline engine, Svelte attachment lifetime. */
export function createAnimate(policy: MotionPolicy | (() => MotionPolicy) = {}): AnimateScope {
	const inherited = readMotionConfig();
	const token = {};
	let root: Element | undefined;
	let generation = 0;
	type Run = {
		controls: AnimationPlaybackControlsWithThen;
		nodes: Set<Element>;
		release: () => void;
		finish: () => void;
		stop: () => void;
	};
	const runs = new Set<Run>();
	const reduced = () =>
		untrack(() =>
			shouldReduceMotion({ ...inherited(), ...(typeof policy === 'function' ? policy() : policy) })
		);
	const resolve = (target: ScopedTarget): Element[] => {
		if (!root)
			throw new Error('Astra motion: attach the animation scope before starting playback.');
		const scopeRoot = root;
		const nodes =
			typeof target === 'string'
				? Array.from(root.querySelectorAll(target))
				: target instanceof Element
					? [target]
					: Array.from(target);
		if (!nodes.length)
			throw new Error(
				`Astra motion: scoped animation target matched no elements: ${String(target)}.`
			);
		if (
			nodes.some(
				(node) => !(node instanceof Element) || (node !== scopeRoot && !scopeRoot.contains(node))
			)
		)
			throw new Error('Astra motion: animation targets must belong to the attached scope.');
		return [...new Set(nodes)];
	};
	const stop = () => {
		for (const run of [...runs]) {
			run.stop();
		}
	};
	function start(
		nodes: Element[],
		transformNodes: ReadonlySet<Element>,
		play: (forceReduce?: boolean) => AnimationPlaybackControlsWithThen
	) {
		const releases: (() => void)[] = [];
		try {
			for (const node of new Set(nodes)) {
				releases.push(claimMotionOwnership(node, 'timeline', token));
				if (transformNodes.has(node)) {
					const visual = visualElementStore.get(node);
					const ownsTransform = visual && transforms(visual.latestValues);
					const style = getComputedStyle(node);
					if (
						[
							ownsTransform ? 'none' : style.transform,
							style.translate,
							style.rotate,
							style.scale
						].some((value) => value && value !== 'none')
					)
						throw new Error(
							'Astra motion: scoped animation cannot take over an authored CSS transform. Move the transform into animation targets, or animate a separate child.'
						);
				}
			}
		} catch (error) {
			releases.forEach((release) => release());
			throw error;
		}
		// Replacing any subject cancels its previous sequence as a whole: no stale later segment.
		for (const run of [...runs])
			if (nodes.some((node) => run.nodes.has(node))) {
				run.stop();
			}
		let native: AnimationPlaybackControlsWithThen;
		try {
			native = play();
		} catch (error) {
			releases.forEach((release) => release());
			throw error;
		}
		const mountedGeneration = generation;
		let stopped = false;
		let playbackRevision = 0;
		const run: Run = {
			controls: native,
			nodes: new Set(nodes),
			stop: () => {
				stopped = true;
				prepareMotionHandoff(native);
				native.stop();
				run.release();
			},
			finish: () => {
				run.stop();
				start(nodes, transformNodes, () => play(true));
			},
			release: () => {
				playbackRevision++;
				runs.delete(run);
				// Motion can queue a final render while stopping or completing values.
				// Commit it while this scope still owns the node, then remove the queued
				// write so a subsequent state/scroll/timeline owner cannot be overwritten.
				for (const node of run.nodes) {
					const visual = visualElementStore.get(node);
					if (!visual) continue;
					visual.render();
					cancelFrame(visual.render);
				}
				releases.splice(0).forEach((release) => release());
			}
		};
		runs.add(run);
		const observeFinish = () => {
			const current = ++playbackRevision;
			void native.then(() => {
				if (current === playbackRevision) run.release();
			});
		};
		observeFinish();
		const acquirePlayback = () => {
			if (!root || generation !== mountedGeneration)
				throw new Error('Astra motion: this playback belongs to a detached animation scope.');
			if (stopped)
				throw new Error(
					'Astra motion: stopped playback cannot restart. Start a new animation instead.'
				);
			resolve(run.nodes);
			if (runs.has(run)) return;
			try {
				for (const node of run.nodes) releases.push(claimMotionOwnership(node, 'timeline', token));
			} catch (error) {
				releases.splice(0).forEach((release) => release());
				throw error;
			}
			for (const other of [...runs]) if (nodes.some((node) => other.nodes.has(node))) other.stop();
			runs.add(run);
		};
		// Completed playback can still write through seek/complete, not just play(). Every
		// mutation must revalidate membership and ownership before touching Motion's controls.
		return new Proxy(native, {
			get(target, key) {
				const value = Reflect.get(target, key, target);
				if (['play', 'pause', 'complete', 'attachTimeline'].includes(String(key)))
					return (...args: unknown[]) => {
						acquirePlayback();
						const result = value.apply(target, args);
						if (key !== 'pause') observeFinish();
						return result;
					};
				if (key === 'stop' || key === 'cancel')
					return () => {
						if (!root || generation !== mountedGeneration)
							throw new Error('Astra motion: this playback belongs to a detached animation scope.');
						if (stopped) return;
						acquirePlayback();
						if (key === 'stop') run.stop();
						else {
							stopped = true;
							prepareMotionHandoff(target, { settleFinished: false });
							target.cancel();
							run.release();
						}
					};
				return typeof value === 'function' ? value.bind(target) : value;
			},
			set(target, key, value) {
				acquirePlayback();
				return Reflect.set(target, key, value, target);
			}
		});
	}
	const attach: Attachment<Element> = (node) => {
		if (root) throw new Error('Astra motion: an animation scope can attach to one root at a time.');
		root = node;
		generation++;
		const settle = () => {
			if (reduced())
				for (const run of [...runs]) {
					run.finish();
				}
		};
		const cleanup = [observeMotionPreference(settle), observeMotionConfig(inherited, settle)];
		return () => {
			stop();
			cleanup.forEach((release) => release());
			root = undefined;
		};
	};
	return {
		attach,
		animate(target, keyframes, options = {}) {
			const nodes = resolve(target);
			return start(nodes, new Set(transforms(keyframes) ? nodes : []), (forceReduce) =>
				motionAnimate(nodes, keyframes, {
					...untrack(inherited).transition,
					...options,
					...(forceReduce || reduced()
						? { skipAnimations: true, duration: 0, delay: 0, repeat: 0, repeatDelay: 0 }
						: {})
				})
			);
		},
		sequence(sequence, options = {}) {
			const nodes: Element[] = [];
			const transformNodes = new Set<Element>();
			const resolved = sequence.map((segment) => {
				if (!Array.isArray(segment)) return segment;
				const [target, keyframes, transition] = segment;
				const elements = resolve(target);
				nodes.push(...elements);
				if (transforms(keyframes)) elements.forEach((node) => transformNodes.add(node));
				return transition
					? ([elements, keyframes, transition] as [
							Element[],
							DOMKeyframesDefinition,
							SegmentTransitionOptions
						])
					: ([elements, keyframes] as [Element[], DOMKeyframesDefinition]);
			});
			if (!nodes.length)
				throw new Error('Astra motion: a scoped sequence needs at least one animation segment.');
			return start(nodes, transformNodes, (forceReduce) =>
				motionAnimate(resolved, {
					...options,
					defaultTransition: { ...untrack(inherited).transition, ...options.defaultTransition },
					...(forceReduce || reduced()
						? { skipAnimations: true, duration: 0, delay: 0, repeat: 0, repeatDelay: 0 }
						: {})
				})
			);
		},
		stop,
		get current() {
			return root;
		},
		get active() {
			return runs.size;
		}
	};
}
