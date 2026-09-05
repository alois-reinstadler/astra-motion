<script lang="ts">
	import { createLayout } from 'astra-motion/layout';
	import { popLayout, presence } from 'astra-motion/presence';
	const layout = createLayout();
	let items = $state(['Alto', 'Brio', 'Coda', 'Dune']);
</script>

<div class="list">
	{#each items as item (item)}
		<button
			{@attach layout()}
			{@attach popLayout()}
			transition:presence={{ duration: 240 }}
			onclick={() => (items = items.filter((name) => name !== item))}
		>
			{item} ×
		</button>
	{/each}
</div>

<style>
	.list {
		position: relative;
		display: grid;
		gap: 12px;
	}
	button {
		padding: 16px;
		text-align: left;
	}
</style>
