<script lang="ts">
	import { animateView } from '$lib/motion/index.js';
	const id = $props.id();
	let expanded = $state(false);
	let outcome = $state('Ready');
	async function toggle() {
		const transition = animateView(
			() => {
				expanded = !expanded;
			},
			{ reducedMotion: 'user' }
		)
			.add(`#${CSS.escape(id)}`)
			.layout({ duration: 0.3 })
			.new({ opacity: [0.6, 1] }, { duration: 0.2 });
		outcome = await transition.finished;
	}
</script>

<div class="snippet-stage">
	<button onclick={toggle}>Toggle card</button>
	<article {id} class:expanded>Browser snapshot animation</article>
	<p aria-live="polite">{outcome}</p>
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

	article {
		width: 180px;
		padding: 24px;
		background: #def;
	}
	article.expanded {
		width: 280px;
	}
</style>
