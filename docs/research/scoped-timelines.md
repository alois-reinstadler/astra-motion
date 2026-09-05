# Scoped timelines

`createAnimate` wraps the documented vanilla [`animate` API](https://motion.dev/docs/animate), imported from official `motion@13.2.0`. It does not implement a timeline engine. Motion owns sequencing, labels, offsets, per-value keyframes, stagger, springs, interpolation, native playback controls and interruption.

```svelte
<script lang="ts">
	import { createAnimate } from 'astra-motion/animate';
	import { stagger } from 'astra-motion/values';
	const scene = createAnimate();

	function play() {
		return scene.sequence([
			['.tile', { y: -30 }, { duration: 0.4, delay: stagger(0.06) }],
			'return',
			['.tile', { y: 0 }, { at: 'return', duration: 0.4 }]
		]);
	}
</script>

<button onclick={play}>Play</button>
<section {@attach scene.attach}>
	<div class="tile">First</div>
	<div class="tile">Second</div>
</section>
```

For a single target, use `scene.animate('.tile', { opacity: 0.5 }, { duration: 0.2 })`. Both methods return Motion controls: `pause()`, `play()`, `stop()`, `cancel()`, `complete()`, `time`, `speed`, and `await controls`. `scene.stop()` stops all active playback. Selectors match descendants of the attached root; direct elements and iterables must also belong to that root. A direct reference can target the root itself. Empty matches and outside targets throw an actionable error before any sequence segment starts.

The attachment stops all owned animations when its real element is destroyed. An interrupted sequence is canceled as a whole when new playback targets any of its elements. Disjoint elements can animate concurrently. This deliberately avoids queued stale segments; use one sequence to coordinate overlapping effects. Paused controls stay owned. Finished and canceled controls release bookkeeping; restarting completed controls reacquires ownership. Old controls cannot restart or mutate playback after their scope is detached, even if a new root is later attached. A stopped control cannot restart; start a new animation instead.

A lightweight shared registry prevents concurrent state, projection, timeline, and scroll writers on the same element. For nodes with `createMotion`, use that binding's `animate()` instead. A scoped timeline can target ordinary descendants inside a layout container. Paint-only animations preserve authored CSS transforms. A transform animation on an element whose transform is still application-owned produces a diagnostic, including after an earlier opacity animation created its Motion visual element; put that transform in Motion targets or on another element. Mixed sequences check only the elements whose segments animate transforms. This is intentionally conservative, including paint-only writes to a state/projection node.

`MotionConfig.transition` supplies ordinary animation defaults and sequence `defaultTransition`; call-site options override them. `MotionConfig` and operating-system reduced-motion changes cancel active playback and apply its final target immediately, including infinite timelines. The canceled control retains Motion’s cancellation promise semantics. Starting under reduced motion removes durations, delays and repetition, including infinite sequence repetition. A local policy object/getter overrides inherited policy; local getters are read when playback starts, while live change notifications come from `MotionConfig` and the operating-system listener. No server DOM access occurs during scope creation. Attachments have no SSR side effects, and imperative playback before attachment throws. This helper does not generate initial server styles; use ordinary rendered styles or `createMotion().props` for declarative SSR animation state.

This scoped API intentionally supports DOM/SVG targets only. Motion's arbitrary-object, callback and MotionValue sequences remain available directly through official `motion`; they are not silently claimed by a DOM scope. Cancellation retains upstream semantics: stopping a control need not resolve its `finished` promise. Scope cleanup does not wait for that promise, and async application flows should use a revision/abort guard when canceled work must be ignored.

Try `/motion-lab/timelines`: staggered sequence, named phase, pause/resume, repeated replacement, retarget, destroy/remount, reduced motion, and two independent scopes sharing selectors.

Completed controls may still write when sought, paused or completed again. Every mutating operation now revalidates scope membership and ownership; it cannot take over a node acquired by another binding. Seeking completed playback reacquires ownership until it is stopped or completed. Stopped/canceled controls cannot restart. See the [120-cycle reliability soak](reliability-soak.md).
