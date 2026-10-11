<script lang="ts">
	import { LayoutGroup, motion } from '$lib/motion/index.js';
	let grouped = $state(true);
	let firstOpen = $state(false);
	let secondOpen = $state(false);
	const namespace = $props.id();
</script>

{#snippet panels()}
	<motion.details
		layout
		layoutDependency={firstOpen}
		ontoggle={(event) => (firstOpen = event.currentTarget.open)}
		class="panel"
	>
		<motion.summary layout="position">What should move?</motion.summary>
		<motion.p layout="position"
			>Let layout connect the size and position changes that your CSS already describes.</motion.p
		>
	</motion.details>
	<motion.details
		layout
		layoutDependency={secondOpen}
		ontoggle={(event) => (secondOpen = event.currentTarget.open)}
		class="panel"
	>
		<motion.summary layout="position">What stays native?</motion.summary>
		<motion.p layout="position">
			These details elements keep their own open state, keyboard behavior, and semantics. The
			sibling moves when either one expands.
		</motion.p>
	</motion.details>
{/snippet}
<div class="demo">
	<label class="group-toggle"
		><input type="checkbox" bind:checked={grouped} /> Coordinate the siblings with LayoutGroup</label
	>
	{#key grouped}
		{#if grouped}<LayoutGroup id={namespace}>{@render panels()}</LayoutGroup>
		{:else}{@render panels()}{/if}
	{/key}
	<p class="hint">
		Open the first panel and watch the second. Each has its own layoutDependency: the group includes
		the unchanged sibling in the measurement. Switch the group off to compare.
	</p>
</div>

<style>
	.group-toggle {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 12px;
		margin: 0 0 18px;
	}
	input {
		accent-color: #bc3c21;
	}
	.demo {
		width: 100%;
		max-width: 340px;
		margin: auto;
		color: #252821;
	}
	.demo :global(.panel) {
		margin-bottom: 10px;
		border: 1px solid #ddded3;
		border-radius: 8px;
		background: #fffdf7;
		overflow: hidden;
	}
	.demo :global(summary) {
		padding: 17px;
		font-size: 13px;
		cursor: pointer;
	}
	.demo :global(summary:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: -4px;
	}
	.demo :global(.panel p),
	.hint {
		margin: 0;
		padding: 0 17px 18px;
		color: #62695a;
		font-size: 12px;
		line-height: 1.6;
	}
	.hint {
		margin-top: 15px;
		padding: 0;
		font-size: 11px;
		text-align: center;
	}
</style>
