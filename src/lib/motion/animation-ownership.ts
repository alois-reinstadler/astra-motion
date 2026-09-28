import type { AnimationPlaybackControls, VisualElement } from 'motion-dom';

const owners = new WeakMap<AnimationPlaybackControls, VisualElement>();

/** Borrowing a style value does not borrow its external playback's lifecycle. */
export function ownsMotionAnimation(
	visual: VisualElement,
	playback: AnimationPlaybackControls
): boolean {
	return owners.get(playback) === visual;
}

/** Claim only playback started by this visual's declarative/controls command. */
export function startOwnedMotionAnimations<T>(visual: VisualElement, start: () => T): T {
	const previous = new Set<AnimationPlaybackControls>();
	visual.values.forEach((value) => {
		if (value.animation) previous.add(value.animation);
	});
	const result = start();
	visual.values.forEach((value) => {
		const animation = value.animation;
		if (animation && !previous.has(animation)) owners.set(animation, visual);
	});
	return result;
}
