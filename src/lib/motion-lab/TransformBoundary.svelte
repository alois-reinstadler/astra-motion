<script lang="ts">
	import TransformOwnership from './TransformOwnership.svelte';
	let { takeover = false }: { takeover?: boolean } = $props();
</script>

<svelte:boundary>
	<TransformOwnership config={{ animate: takeover ? { x: 20, opacity: 1 } : { opacity: 1 } }} />
	{#snippet failed(error)}<p data-transform-error>{String(error)}</p>{/snippet}
</svelte:boundary>
