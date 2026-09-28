<script lang="ts">
	import {
		AnimateActivity,
		AnimatePresence,
		AnimateView,
		MotionConfig,
		motion,
		startViewTransition
	} from '../motion/index.js';
	import type { ViewAnimationType } from '../motion/view-types.js';
	let { onView }: { onView?: (type: ViewAnimationType) => void } = $props();
	let present = $state(true);
	let mode = $state<'visible' | 'hidden'>('visible');
	let reducedMotion = $state<'never' | 'always'>('never');
	let count = $state(0);
	export function hide() {
		return startViewTransition(() => {
			mode = 'hidden';
		});
	}
	export function show() {
		return startViewTransition(() => {
			mode = 'visible';
		});
	}
	export function remove() {
		return startViewTransition(() => {
			present = false;
		});
	}
	export function update(wait: () => Promise<void>) {
		return startViewTransition(async () => {
			await wait();
			count++;
		});
	}
	export function reduce() {
		reducedMotion = 'always';
	}
</script>

<MotionConfig {reducedMotion}>
	<AnimatePresence {present} initial={false}>
		<AnimateActivity {mode} initial={false} data-verification-view-activity>
			<motion.section
				data-verification-presence-root
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.25 }}
			>
				<AnimateView
					name="verification-retained-card"
					transition={{ duration: 0.12 }}
					onAnimationComplete={onView}
				>
					{#snippet children(view)}
						<div
							{@attach view}
							data-verification-view-card
							style="view-transition-name: authored-verification-card !important; width: 220px; height: 90px; background: rgb(160, 190, 230);"
						>
							<input aria-label="Combined view draft" />
							<output data-verification-view-count>{count}</output>
						</div>
					{/snippet}
				</AnimateView>
			</motion.section>
		</AnimateActivity>
	</AnimatePresence>
</MotionConfig>
