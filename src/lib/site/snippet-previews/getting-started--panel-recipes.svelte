<script lang="ts">
	import { AnimatePresence, motion } from '$lib/motion/index.js';
	const panels = [
		{ id: 'overview', title: 'Overview', text: 'Your current project.' },
		{ id: 'history', title: 'History', text: 'Your saved changes.' }
	];
	let selected = $state(panels[0]);
</script>

<div class="snippet-stage">
	<nav aria-label="Project sections">
		{#each panels as panel (panel.id)}
			<button aria-pressed={selected.id === panel.id} onclick={() => (selected = panel)}>
				{panel.title}
			</button>
		{/each}
	</nav>
	<AnimatePresence value={selected} key={(panel) => panel.id} mode="wait">
		{#snippet children(panel)}
			<motion.section
				aria-label={panel.title}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.15 }}
			>
				<h2>{panel.title}</h2>
				<p>{panel.text}</p>
			</motion.section>
		{/snippet}
	</AnimatePresence>
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

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
