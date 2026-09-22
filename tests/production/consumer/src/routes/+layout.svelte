<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
	import { resolve } from '$app/paths';
	let { children }: { children: Snippet } = $props();
</script>

<svelte:head><link rel="icon" href="data:," /></svelte:head>

<nav aria-label="Qualification">
	<a href={resolve('/')}>Exports</a><a href={resolve('/state')}>State</a><a
		href={resolve('/layout')}>Layout</a
	><a href={resolve('/presence')}>Presence</a><a href={resolve('/scroll')}>Scroll</a><a
		href={resolve('/lifecycle/cache')}>Lifecycle</a
	><a href={resolve('/performance')}>Performance</a>
</nav>
<main data-hydrated={hydrated}>{@render children()}</main>

<style>
	:global(body) {
		margin: 0;
		font: 16px/1.5 system-ui;
		color: #20271e;
		background: #f8f7f0;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		padding: 20px;
		border-bottom: 1px solid #ccc;
	}
	main {
		padding: 24px;
		max-width: 1100px;
		margin: auto;
	}
	:global(button) {
		font: inherit;
		padding: 8px 14px;
		cursor: pointer;
		margin: 4px;
	}
	:global(a) {
		color: #243f77;
	}
</style>
