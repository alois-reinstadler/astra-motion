<script lang="ts">
	import { createLayout, type LayoutGroupOptions } from '../motion/layout.js';
	let {
		dense = false,
		observationRoot
	}: { dense?: boolean; observationRoot?: LayoutGroupOptions['observationRoot'] } = $props();
	// Keep a separate controller while observing the sidebar that can resize these cards.
	const layout = createLayout({ observationRoot: () => observationRoot?.() });
	const labels = ['Material studies', 'Field recordings', 'Objects in space', 'Working notes'];
</script>

<div class="cards" class:dense data-extra="dashboard-cards">
	{#each labels as label, i (label)}
		<article {@attach layout({ style: { borderRadius: 10 } })}>
			<div class="content" {@attach layout({ mode: 'position' })}>
				<small>COLLECTION / 0{i + 1}</small>
				<h3>{label}</h3>
			</div>
		</article>
	{/each}
</div>

<style>
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 130px), 1fr));
		gap: 10px;
		min-width: 0;
		flex: 1;
	}
	.cards.dense {
		grid-template-columns: 1fr;
	}
	article {
		background: #f8f9f3;
		padding: 18px;
		min-width: 0;
	}
	small {
		font:
			9px ui-monospace,
			monospace;
		color: #777e6d;
		letter-spacing: 0.8px;
	}
	h3 {
		margin: 12px 0 0;
		font:
			19px/1.2 Georgia,
			serif;
	}
</style>
