<script lang="ts">
	import { createLayout } from 'astra-motion/layout';
	const tabs = createLayout({ id: 'product-tabs' });
	const labels = ['Overview', 'Details', 'Materials'];
	let selected = $state('Overview');
</script>

<nav aria-label="Product sections">
	{#each labels as label (label)}
		<button aria-pressed={selected === label} onclick={() => (selected = label)}>
			{label}
			{#if selected === label}
				<span {@attach tabs({ id: 'underline' })}></span>
			{/if}
		</button>
	{/each}
</nav>

<style>
	nav {
		display: flex;
		gap: 24px;
	}
	button {
		position: relative;
		padding: 12px 0;
	}
	span {
		position: absolute;
		inset: auto 0 0;
		height: 3px;
		background: currentColor;
	}
</style>
