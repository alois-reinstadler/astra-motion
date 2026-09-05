import {
	AsyncMotionValueAnimation,
	GroupAnimation,
	NativeAnimationExtended,
	getFinalKeyframe,
	type AnimationPlaybackControls
} from 'motion-dom';

/**
 * Motion 13.2 cancellation boundary. Keep these two private fields isolated here:
 * Async.animation's public getter flushes unrelated pending keyframe measurements;
 * Native.cancel() leaves a queued onfinish able to overwrite a replacement owner.
 * Regression/upgrade gates cover unresolved values, endpoint direction, late events
 * and ownership transfer. No deep imports or dependency/prototype patches.
 */
export function prepareMotionHandoff(
	playback: AnimationPlaybackControls | undefined,
	{
		finishedOnly = false,
		settleFinished = true
	}: { finishedOnly?: boolean; settleFinished?: boolean } = {}
): boolean {
	if (playback instanceof GroupAnimation) {
		for (const animation of playback.animations)
			prepareMotionHandoff(animation, { finishedOnly, settleFinished });
		return false;
	}
	if (playback instanceof AsyncMotionValueAnimation) {
		playback = (playback as unknown as { _animation?: AnimationPlaybackControls })._animation;
	}
	if (!(playback instanceof NativeAnimationExtended)) return false;
	const finished = playback.state === 'finished';
	if (finishedOnly && !finished) return false;
	const handle = (playback as unknown as { animation: Animation }).animation;
	handle.onfinish = null;
	if (finished && settleFinished) {
		const { keyframes, finalKeyframe, motionValue } = playback.options;
		const final = getFinalKeyframe(keyframes, playback.options, finalKeyframe, playback.speed);
		playback.updateMotionValue(final);
		motionValue?.setWithVelocity(final, final, 1);
		playback.cancel();
	}
	return finished;
}
