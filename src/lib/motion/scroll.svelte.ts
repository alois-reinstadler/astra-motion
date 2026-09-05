import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { animate, scroll, type scrollInfo } from 'motion';

type ScrollInfo = Parameters<Parameters<typeof scrollInfo>[0]>[0];
import {
	motionValue,
	frame,
	camelToDash,
	transformProps,
	type AnimationOptions,
	type DOMKeyframesDefinition,
	type AnimationPlaybackControlsWithThen
} from 'motion-dom';
import { observeMotionPreference, observeMotionConfig, readMotionConfig } from './config.js';
import { shouldReduceMotion, type MotionPolicy } from './policy.js';
import { claimMotionOwnership, hasMotionOwnership } from './ownership.js';

/** Motion's documented scroll options. Attachments can supply container and target instead. */
export type ScrollOptions = NonNullable<Parameters<typeof scroll>[1]> & MotionPolicy;
export type ScrollAnimationOptions = Omit<
	AnimationOptions,
	'repeat' | 'repeatType' | 'repeatDelay'
>;

/** Component-scoped scroll progress and scroll-linked animations, powered by Motion. */
export function createScroll(input: ScrollOptions | (() => ScrollOptions) = {}) {
	const config = readMotionConfig();
	const progress = motionValue(0);
	let container = $state.raw<HTMLElement>();
	let target = $state.raw<HTMLElement>();
	let hadContainer = $state(false);
	let hadTarget = $state(false);
	let preference = $state(0);
	const activeLinks: (() => void)[] = [];
	function readOptions() {
		return {
			reducedMotion: config().reducedMotion,
			...(typeof input === 'function' ? input() : input)
		};
	}
	const options = $derived.by(readOptions);
	const ready = $derived((!hadContainer || !!container) && (!hadTarget || !!target));
	const tracking = $derived({
		...options,
		...(container ? { container } : {}),
		...(target ? { target } : {})
	});
	const reduced = $derived.by(() => {
		void preference;
		return shouldReduceMotion(options);
	});

	function policyChanged() {
		preference++;
		if (shouldReduceMotion(readOptions())) for (const settle of [...activeLinks]) settle();
	}
	function observePreference() {
		const cleanups = [
			observeMotionPreference(policyChanged),
			observeMotionConfig(config, policyChanged)
		];
		return () => cleanups.forEach((cleanup) => cleanup());
	}
	function trackProgress() {
		if (!ready) return;
		const scrollOptions = tracking;
		// The documented info callback uses Motion's reference-counted event tracker.
		// Its one-argument/timeline path caches containers indefinitely in Motion 13.2.
		return scroll(
			(_value: number, info: ScrollInfo) => progress.set(info[scrollOptions.axis ?? 'y'].progress),
			{
				...scrollOptions,
				container: scrollOptions.source ?? scrollOptions.container
			}
		);
	}
	function disposeProgress() {
		return () => progress.destroy();
	}
	$effect(observePreference);
	$effect(trackProgress);
	$effect(disposeProgress);

	const attachContainer: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			if (container && container !== node)
				throw new Error('Astra scroll: one controller can track only one container.');
			hadContainer = true;
			container = node;
			return () => {
				if (container === node) container = undefined;
			};
		});
	const attachTarget: Attachment<HTMLElement> = (node) =>
		untrack(() => {
			if (target && target !== node)
				throw new Error('Astra scroll: one controller can track only one target.');
			hadTarget = true;
			target = node;
			return () => {
				if (target === node) target = undefined;
			};
		});

	return {
		/** Selected-axis progress, independent of reduced-motion policy. Owned by this component. */
		progress,
		container: attachContainer,
		target: attachTarget,
		get reducedMotion() {
			return reduced;
		},
		/** Native-element attachment. Motion owns the keyed styles until attachment cleanup. */
		animate(
			keyframes: DOMKeyframesDefinition,
			transition: ScrollAnimationOptions = {}
		): Attachment<HTMLElement> {
			for (const setting of [transition, ...Object.values(transition)]) {
				if (
					setting &&
					typeof setting === 'object' &&
					'repeat' in setting &&
					setting.repeat !== undefined &&
					setting.repeat !== 0
				) {
					throw new Error(
						'Astra scroll: repeating animations do not define a finite scroll range.'
					);
				}
			}
			return (node) => {
				const transforms = Object.keys(keyframes).some(
					(key) => key === 'transform' || transformProps.has(key)
				);
				if (transforms) {
					const style = getComputedStyle(node);
					if (
						style.transform !== 'none' ||
						style.translate !== 'none' ||
						style.scale !== 'none' ||
						style.rotate !== 'none'
					) {
						throw new Error(
							'Astra scroll: move authored transforms into the scroll keyframes, or animate a separate child.'
						);
					}
				}
				const ownedStyles = Object.fromEntries(
					Object.keys(keyframes).map((key) => {
						const property = transformProps.has(key)
							? 'transform'
							: key.startsWith('--')
								? key
								: camelToDash(key);
						return [
							property,
							{
								value: node.style.getPropertyValue(property),
								priority: node.style.getPropertyPriority(property)
							}
						];
					})
				);
				function restoreStyles() {
					for (const [property, original] of Object.entries(ownedStyles)) {
						if (original.value) node.style.setProperty(property, original.value, original.priority);
						else node.style.removeProperty(property);
					}
				}
				let revision = 0;
				function linkAnimation() {
					const current = ++revision;
					if (!ready) return;
					const scrollOptions = tracking;
					const reduce = reduced;
					return untrack(() => {
						const release = claimMotionOwnership(node, 'scroll', {});
						let animation: AnimationPlaybackControlsWithThen | undefined;
						let detach: (() => void) | undefined;
						let closed = false;
						let completed = false;
						const settle = () => {
							if (closed || completed) return;
							completed = true;
							animation?.cancel();
							detach?.();
							detach = undefined;
							animation?.stop();
							animation = animate(node, keyframes, {
								...transition,
								skipAnimations: true,
								duration: 0,
								delay: 0,
								autoplay: true
							});
							animation.complete();
						};
						const cleanup = () => {
							if (closed) return;
							closed = true;
							const index = activeLinks.indexOf(settle);
							if (index !== -1) activeLinks.splice(index, 1);
							animation?.cancel();
							detach?.();
							animation?.stop();
							restoreStyles();
							release();
							// Motion's JS cancellation can leave one already-scheduled style render.
							// Restore after that render, unless a new attachment/owner has taken over.
							frame.postRender(() => {
								if (revision === current && !hasMotionOwnership(node)) restoreStyles();
							});
						};
						try {
							animation = animate(node, keyframes, {
								duration: 1,
								ease: 'linear',
								...transition,
								autoplay: true
							});
							activeLinks.push(settle);
							if (reduce) settle();
							else {
								// Keep native container acceleration without Motion's global timeline cache.
								// Targets/custom offsets reuse this controller's measured progress instead.
								const timeline =
									!scrollOptions.target && !scrollOptions.offset && window.ScrollTimeline
										? new window.ScrollTimeline({
												source:
													scrollOptions.source ??
													scrollOptions.container ??
													document.scrollingElement!,
												axis: scrollOptions.axis ?? 'y'
											})
										: undefined;
								detach = animation.attachTimeline({
									// DOM types allow numeric time; scroll timelines expose percentage CSSUnitValue.
									timeline: timeline as Parameters<
										AnimationPlaybackControlsWithThen['attachTimeline']
									>[0]['timeline'],
									observe(valueAnimation) {
										valueAnimation.pause();
										const seek = (value: number) => {
											valueAnimation.time = valueAnimation.iterationDuration * value;
										};
										seek(progress.get());
										return progress.on('change', seek);
									}
								});
							}
						} catch (error) {
							cleanup();
							throw error;
						}
						return cleanup;
					});
				}
				$effect(linkAnimation);
			};
		}
	};
}
export type ScrollController = ReturnType<typeof createScroll>;
