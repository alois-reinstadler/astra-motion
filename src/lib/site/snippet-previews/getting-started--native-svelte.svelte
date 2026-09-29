<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let shown = $state(true);
	let selected = $state<string[]>([]);
	const choice = motion.bind(() => ({
		initial: { opacity: 0 },
		animate: { opacity: 1, scale: selected.includes('news') ? 1.1 : 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.2 },
		reducedMotion: 'user'
	}));
	const enterExit = choice.transition;
</script>

<div class="snippet-stage">
	<button onclick={() => (shown = !shown)}>Toggle choices</button>
	{#if shown}
		<fieldset>
			<legend>Subscriptions</legend>
			<label
				><input
					class="choice"
					type="checkbox"
					value="news"
					bind:group={selected}
					{...choice.props}
					transition:enterExit|global
				/> News</label
			>
			<label><input type="checkbox" value="events" bind:group={selected} /> Events</label>
		</fieldset>
	{/if}
	<p>Selected: {selected.join(', ') || 'None'}</p>
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

	.choice {
		accent-color: teal;
		outline-offset: 4px;
	}

	fieldset {
		display: grid;
		gap: 12px;
		padding: 16px;
		border: 1px solid #bfc8ae;
		border-radius: 8px;
	}
</style>
