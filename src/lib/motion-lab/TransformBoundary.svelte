<script lang="ts">
	import TransformOwnership from './TransformOwnership.svelte';
	import ReducedInheritedTransform from './ReducedInheritedTransform.svelte';
	let { takeover = false, inherited = false }: { takeover?: boolean; inherited?: boolean } =
		$props();
</script>

<svelte:boundary>
	{#if inherited}
		<ReducedInheritedTransform {takeover} />
	{:else}
		<TransformOwnership config={{ animate: takeover ? { x: 20, opacity: 1 } : { opacity: 1 } }} />
	{/if}
	{#snippet failed(error)}<p data-transform-error>{String(error)}</p>{/snippet}
</svelte:boundary>
