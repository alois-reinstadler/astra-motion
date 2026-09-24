import {
	AsyncMotionValueAnimation,
	GroupAnimation,
	NativeAnimationExtended,
	NativeAnimation,
	getFinalKeyframe,
	type AnimationPlaybackControls,
	type MotionValueAnimation
} from 'motion-dom';

/** Complete the original playback, including WAAPI loops and playback frozen at speed zero. */
export function completeMotionPlayback(playback: AnimationPlaybackControls): void {
	if (playback instanceof GroupAnimation) {
		for (const animation of playback.animations) completeMotionPlayback(animation);
		return;
	}
	if (playback instanceof AsyncMotionValueAnimation) {
		// Completion, unlike cancellation, intentionally resolves pending keyframes.
		completeMotionPlayback(playback.animation);
		return;
	}
	if (playback instanceof NativeAnimation) {
		const handle = (playback as unknown as { animation: Animation }).animation;
		const timing = handle.effect?.getTiming();
		const infinite = timing?.iterations === Infinity;
		const frozen = playback.speed === 0;
		// WAAPI finish() rejects an infinite end time or zero playback rate. Keep
		// Motion's repeat/direction options unchanged so its original finish handler
		// commits the correct endpoint and resolves existing then()/finished callers.
		if (infinite) handle.effect?.updateTiming({ iterations: 1 });
		if (frozen) playback.speed = 1;
		if (infinite || frozen) {
			void playback.finished.then(() => {
				// Preserve the original playback contract when these controls are replayed.
				if (infinite) handle.effect?.updateTiming({ iterations: timing!.iterations });
				if (frozen) playback.speed = 0;
			});
		}
	}
	playback.complete();
}

/**
 * Motion cancellation boundary (qualified with motion-dom 13.4.2).
 * Keep these two private fields isolated here:
 * Async.animation's public getter flushes unrelated pending keyframe measurements;
 * Native.cancel() leaves a queued onfinish able to overwrite a replacement owner.
 * Regression/upgrade gates cover unresolved values, endpoint direction, late events
 * and ownership transfer. No deep imports or dependency/prototype patches.
 */
export function prepareMotionHandoff(
	playback: AnimationPlaybackControls | MotionValueAnimation | undefined,
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
