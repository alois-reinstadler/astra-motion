<script lang="ts">
	import {
		AnimateActivity,
		AnimatePresence,
		AnimateView,
		MotionConfig,
		motion,
		startViewTransition
	} from '../motion/index.js';
	import type { AnimationPlaybackControls } from 'motion-dom';
	let { onViewStart }: { onViewStart?: (controls: AnimationPlaybackControls) => void } = $props();
	let nonce = $state('first-nonce');
	let present = $state(true);
	let active = $state(true);
	let count = $state(0);
	export function configure(next: string) {
		nonce = next;
	}
	export function presence(next: boolean) {
		present = next;
	}
	export function activity(next: boolean) {
		active = next;
	}
	export function view() {
		return startViewTransition(
			() => {
				count++;
			},
			{ reducedMotion: 'never' }
		);
	}
</script>

<MotionConfig {nonce} reducedMotion="never">
	<MotionConfig transition={{ duration: 0.12 }}>
		<div style="position:relative">
			<AnimatePresence {present} mode="popLayout" initial={false}>
				<motion.div data-nonce-inherited initial={{ opacity: 1 }} exit={{ opacity: 0 }}
					>Inherited</motion.div
				>
			</AnimatePresence>
			<AnimatePresence {present} mode="popLayout" initial={false} nonce="explicit-nonce">
				<motion.div data-nonce-explicit initial={{ opacity: 1 }} exit={{ opacity: 0 }}
					>Explicit</motion.div
				>
			</AnimatePresence>
			<AnimateActivity
				mode={active ? 'visible' : 'hidden'}
				layoutMode="pop"
				initial={false}
				data-nonce-activity
			>
				<motion.div data-nonce-active-child initial={{ opacity: 1 }} exit={{ opacity: 0 }}
					>Retained</motion.div
				>
			</AnimateActivity>
		</div>
		<AnimateView name="nonce-view" transition={{ duration: 0.12 }} onAnimationStart={onViewStart}>
			{#snippet children(attach)}
				<div {@attach attach} style="width:120px;height:50px;background:teal">Version {count}</div>
			{/snippet}
		</AnimateView>
	</MotionConfig>
</MotionConfig>
