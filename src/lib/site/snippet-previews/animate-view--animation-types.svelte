<script lang="ts">
	import { onDestroy } from 'svelte';
	import { AnimateView, startViewTransition } from '$lib/motion/index.js';
	const name = $props.id();
	let selected = $state(false);
	let pending: ReturnType<typeof startViewTransition> | undefined;
	function change() {
		pending?.skipTransition();
		pending = startViewTransition(({ addType }) => {
			addType('next');
			selected = !selected;
		});
		void pending.finished.catch(() => {});
	}
	onDestroy(() => pending?.skipTransition());
</script>

<div class="snippet-stage">
	<button onclick={change}>Change view</button>{#key selected}<AnimateView
			{name}
			transition={{ duration: 0.3, layout: { duration: 0.5 } }}
			enter={{ opacity: 1, clipPath: ['inset(0 50%)', 'inset(0 0%)'] }}
			exit={{ opacity: 0 }}
			update={{ transition: { ease: 'easeInOut' } }}
			share={{ transition: { duration: 0.45 } }}
			>{#snippet children(view)}<article
					{@attach view}
					style:width={selected ? '100%' : '65%'}
					style="padding:24px;background:#e4dfce;border-radius:12px;"
				>
					{selected ? 'The next snapshot' : 'A named snapshot'}
				</article>{/snippet}</AnimateView
		>{/key}
</div>

<style>
	.snippet-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		min-height: 180px;
		width: min(100%, 360px);
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
	.snippet-stage :global(input),
	.snippet-stage :global(select) {
		max-width: 100%;
		padding: 6px;
		border: 1px solid #bfc8ae;
		border-radius: 4px;
		background: #f7f7f0;
		color: inherit;
		font: inherit;
	}
	.snippet-stage :global(svg) {
		overflow: visible;
		fill: #d34123;
		touch-action: none;
	}
	.snippet-stage :global(li) {
		padding: 6px 12px;
	}
</style>
