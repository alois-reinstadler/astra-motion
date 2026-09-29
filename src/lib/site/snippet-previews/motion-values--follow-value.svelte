<script lang="ts">
	import {
		motion,
		motionStore,
		useFollowValue,
		useWillChange,
		useReducedMotion
	} from '$lib/motion/index.js';
	let target = $state(0);
	const x = useFollowValue(() => target, { type: 'tween', duration: 0.3 });
	const position = motionStore(x);
	const willChange = useWillChange();
	const reduced = useReducedMotion();
</script>

<div class="snippet-stage">
	<button onclick={() => (target = target ? 0 : 120)}>Move</button>
	<motion.div style={{ x: reduced.current ? 0 : x, willChange }}>Following target</motion.div>
	<p>Position: {$position.toFixed(0)}</p>
</div>

<style>
	.snippet-stage {
		display: grid;
		justify-items: start;
		gap: 16px;
		width: min(100%, 360px);
		min-height: 180px;
		margin: auto;
		color: #252821;
		font-size: 14px;
		line-height: 1.6;
	}
	.snippet-stage :global(button) {
		font: inherit;
		color: inherit;
		padding: 10px 16px;
		border: 1px solid #bfc8ae;
		border-radius: 8px;
		background: #f7f7f0;
		cursor: pointer;
	}
	.snippet-stage :global(button:disabled) {
		opacity: 0.5;
		cursor: default;
	}
	.snippet-stage :global(:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: 4px;
	}
</style>
