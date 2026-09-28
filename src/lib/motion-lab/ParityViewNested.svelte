<script lang="ts">
	import AnimateView from '../motion/AnimateView.svelte';
	import { startViewTransition } from '../motion/view-transitions.js';
	import type { ViewAnimationType } from '../motion/view-types.js';
	let {
		onOuter,
		onInner
	}: { onOuter?: (type: ViewAnimationType) => void; onInner?: (type: ViewAnimationType) => void } =
		$props();
	let count = $state(1);
	export function update() {
		return startViewTransition(
			() => {
				count++;
			},
			{ reducedMotion: 'never' }
		);
	}
</script>

<AnimateView transition={{ duration: 0.04 }} onAnimationComplete={onOuter}>
	{#snippet children(outer)}
		<div {@attach outer} style="width: 300px; height: 100px;">
			Outer
			<AnimateView transition={{ duration: 0.04 }} onAnimationComplete={onInner}>
				{#snippet children(inner)}
					<div {@attach inner} style="width: 40px; height: 40px;">{count}</div>
				{/snippet}
			</AnimateView>
		</div>
	{/snippet}
</AnimateView>
