import {
	applyGeneratorOptions,
	getValueTransition,
	getViewAnimationLayerInfo,
	GroupAnimation,
	mapEasingToNativeEasing,
	NativeAnimation,
	NativeAnimationWrapper,
	type AnimationPlaybackControls,
	type NativeAnimationOptions,
	type ValueKeyframesDefinition
} from 'motion-dom';
import { shouldReduceMotion } from './policy.js';
import type { ViewChange } from './view-registry.js';
import type { ViewTransition } from './view-types.js';

export interface ViewLayerAnimation {
	readonly controls: AnimationPlaybackControls;
	readonly finished: Promise<void>;
	cancel(): void;
}

class ViewAnimationGroup extends GroupAnimation {
	override get time() {
		return this.animations.length ? super.time : 0;
	}
	override set time(value: number) {
		super.time = value;
	}
	override get speed() {
		return this.animations.length ? super.speed : 1;
	}
	override set speed(value: number) {
		super.speed = value;
	}
	override get state() {
		return this.animations.length ? super.state : 'finished';
	}
	override get startTime() {
		return this.animations.length ? super.startTime : null;
	}
}

/** Uses the same DOM engine primitives as Motion 13.4.4's separate AnimateView adapter. */
export function animateViewChanges(
	document: Document,
	changes: readonly ViewChange[],
	types: string[]
): ViewLayerAnimation {
	const { type, snapshot } = changes[0];
	const { transition, onAnimationStart, onAnimationComplete } = snapshot.options;
	const definition = snapshot.options[type];
	const {
		transition: specific,
		transitionEnd,
		...values
	} = (typeof definition === 'function' ? definition(types) : definition) ?? {};
	if (transitionEnd !== undefined)
		throw new Error(
			'Astra AnimateView: transitionEnd is not a CSS snapshot animation. Update the real element in the transaction.'
		);
	const isProperty = (property: string) =>
		!['x', 'y', 'z', 'rotate', 'scale', 'cssText', 'transition'].includes(property) &&
		(property.startsWith('--') ||
			typeof document.documentElement.style[property as keyof CSSStyleDeclaration] === 'string');
	for (const [property, value] of Object.entries(values)) {
		if (value !== undefined && !isProperty(property))
			throw new Error(
				`Astra AnimateView: ${property} is not a CSS snapshot property. Use a complete transform string for transforms.`
			);
	}
	const timingKeys = new Set([
		'duration',
		'delay',
		'ease',
		'times',
		'stiffness',
		'damping',
		'mass',
		'velocity',
		'bounce',
		'visualDuration',
		'restSpeed',
		'restDelta',
		'repeat',
		'autoplay'
	]);
	function validateTiming(timing: ViewTransition | undefined, nested = false) {
		for (const [key, value] of Object.entries(timing ?? {})) {
			if (value === undefined) continue;
			if (key === 'type') {
				if (typeof value !== 'function')
					throw new Error(
						'Astra AnimateView: type must be a generator such as the imported spring function.'
					);
			} else if (key === 'repeatType') {
				if (value !== 'loop' && value !== 'reverse')
					throw new Error('Astra AnimateView: repeatType must be loop or reverse.');
			} else if (!timingKeys.has(key)) {
				if (
					!nested &&
					(key === 'layout' || key === 'default' || isProperty(key)) &&
					typeof value === 'object' &&
					value !== null
				)
					validateTiming(value as ViewTransition, true);
				else throw new Error(`Astra AnimateView: unsupported snapshot transition option ${key}.`);
			}
		}
	}
	validateTiming(transition);
	validateTiming(specific);
	const custom = Object.keys(values).length > 0;
	const reduced = shouldReduceMotion(snapshot.options);
	const animations: AnimationPlaybackControls[] = [];
	try {
		for (const { name } of changes) {
			let matched = false;
			for (const animation of document.getAnimations()) {
				const effect = animation.effect as KeyframeEffect | null;
				if (!effect?.pseudoElement || animation.playState === 'finished') continue;
				const info = getViewAnimationLayerInfo(effect.pseudoElement);
				if (!info || info.layer !== name) continue;
				matched = true;
				if (custom && info.type !== 'group') {
					animation.cancel();
					continue;
				}
				const property = info.type === 'group' ? 'layout' : '';
				const options = {
					...getValueTransition(transition, property),
					...getValueTransition(specific, property)
				};
				const resolved = applyGeneratorOptions({
					...options,
					duration: reduced ? 0 : (options.duration ?? 0.3) * 1000
				});
				const easing = mapEasingToNativeEasing(resolved.ease, resolved.duration ?? 300);
				if (Array.isArray(easing)) {
					effect.setKeyframes(
						effect.getKeyframes().map((keyframe, index) => ({
							...keyframe,
							easing: easing[index % easing.length] ?? 'linear'
						}))
					);
				}
				effect.updateTiming({
					duration: resolved.duration,
					delay: reduced ? 0 : (options.delay ?? 0) * 1000,
					iterations: reduced ? 1 : (options.repeat ?? 0) + 1,
					direction: options.repeatType === 'reverse' ? 'alternate' : 'normal',
					easing: Array.isArray(easing) ? 'linear' : easing
				});
				if (options.autoplay === false && !reduced) animation.pause();
				animations.push(new NativeAnimationWrapper(animation));
			}
			if (custom && matched) {
				for (const [property, value] of Object.entries(values)) {
					if (value === undefined) continue;
					let keyframes = value as ValueKeyframesDefinition;
					if (property === 'opacity' && !Array.isArray(keyframes))
						keyframes = [type === 'enter' ? 0 : 1, keyframes];
					const options = {
						...getValueTransition(transition, property),
						...getValueTransition(specific, property)
					};
					animations.push(
						new NativeAnimation({
							...options,
							repeat: reduced ? 0 : options.repeat,
							autoplay: reduced ? true : options.autoplay,
							duration: reduced
								? 0
								: options.duration === undefined
									? undefined
									: options.duration * 1000,
							delay: reduced ? 0 : (options.delay ?? 0) * 1000,
							element: document.documentElement,
							name: property,
							keyframes,
							pseudoElement: `::view-transition-${type === 'enter' ? 'new' : 'old'}(${name})`
						} as NativeAnimationOptions)
					);
				}
			}
		}
	} catch (error) {
		for (const animation of animations) animation.cancel();
		throw error;
	}
	const group = new ViewAnimationGroup(animations);
	let active = true;
	let settleCancellation = () => {};
	const cancelled = new Promise<void>((resolve) => (settleCancellation = resolve));
	const originalCancel = group.cancel.bind(group);
	const originalStop = group.stop.bind(group);
	const cancel = () => {
		active = false;
		originalCancel();
		settleCancellation();
	};
	group.cancel = cancel;
	group.stop = () => {
		active = false;
		originalStop();
		settleCancellation();
	};
	const finished = Promise.race([group.finished, cancelled]).then(() => {
		if (active) onAnimationComplete?.(type);
	});
	Object.defineProperty(group, 'finished', { get: () => finished });
	void finished.catch(() => {});
	try {
		onAnimationStart?.(group, type);
	} catch (error) {
		cancel();
		throw error;
	}
	return { controls: group, finished, cancel };
}
