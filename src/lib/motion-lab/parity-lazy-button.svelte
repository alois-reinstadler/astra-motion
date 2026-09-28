<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	let { children, ...attributes }: HTMLButtonAttributes = $props();
</script>

<button {...attributes}>{@render children?.()}</button>
