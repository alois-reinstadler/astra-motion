<script lang="ts">
	import { LayoutGroup, motion } from '$lib/motion/index.js';
	let selections = $state([0, 1]);
	const choices = ['Focus', 'Rest'];
</script>

<div class="demo">
	{#each ['morning', 'evening'] as scope, row (scope)}
		<LayoutGroup id={scope}>
			<div class="row" role="group" aria-label={`${scope} preference`}>
				<p>{scope}</p>
				<div class="choices">
					{#each choices as choice, index (choice)}
						<button
							type="button"
							aria-pressed={selections[row] === index}
							onclick={() => (selections[row] = index)}
						>
							{#if selections[row] === index}
								<motion.div
									class="indicator"
									layoutId="selection"
									transition={{ type: 'spring', stiffness: 360, damping: 30 }}
								/>
							{/if}
							<span>{choice}</span>
						</button>
					{/each}
				</div>
			</div>
		</LayoutGroup>
	{/each}
	<p class="hint">
		Both rows use layoutId="selection". Their group IDs keep the highlights independent.
	</p>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 320px;
		margin: auto;
		color: #252821;
	}
	.row {
		margin-bottom: 20px;
	}
	.row p {
		margin: 0 0 8px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 9px;
	}
	.choices {
		display: flex;
		gap: 4px;
		padding: 4px;
		background: #e8e8df;
		border-radius: 9px;
	}
	button {
		position: relative;
		flex: 1;
		padding: 11px;
		border: 0;
		background: transparent;
		border-radius: 6px;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
	button span {
		position: relative;
		z-index: 1;
	}
	.demo :global(.indicator) {
		position: absolute;
		inset: 0;
		border-radius: 6px;
		background: #fffdf7;
		box-shadow: 0 2px 5px #2528210c;
	}
	.hint {
		margin: 0;
		color: #62695a;
		font-size: 11px;
		line-height: 1.6;
	}
</style>
