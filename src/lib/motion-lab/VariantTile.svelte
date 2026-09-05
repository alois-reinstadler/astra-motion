<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	let { number, label }: { number: number; label: string } = $props();
	const tile = createMotion({
		style: { opacity: 0.5, y: 0 },
		variants: {
			rest: { opacity: 0.5, y: 0, rotate: 0 },
			lifted: { opacity: 1, y: -24, rotate: 0 }
		}
	});
</script>

<div {...tile.props} class="tile" data-state-tile={number}>
	<span class="number">0{number}</span><span class="mark" aria-hidden="true">✳</span><strong
		>{label}</strong
	>
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		min-height: 170px;
		padding: 17px;
		border: 1px solid #343c2b30;
		border-radius: 3px;
		background: #eeede5;
	}
	.number {
		font-size: 10px;
		letter-spacing: 0.1em;
	}
	.mark {
		margin: auto;
		font:
			54px Georgia,
			serif;
		color: #c95637;
	}
	strong {
		font-size: 12px;
		font-weight: 500;
	}
	@media (max-width: 600px) {
		.tile {
			min-height: 130px;
			padding: 12px;
		}
		.mark {
			font-size: 38px;
		}
	}
</style>
