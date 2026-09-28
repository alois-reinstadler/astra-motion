<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	let {
		label,
		count = $bindable(0),
		children,
		...attributes
	}: Omit<HTMLButtonAttributes, 'children'> & {
		label: string;
		count?: number;
		children?: Snippet;
	} = $props();
</script>

<button {...attributes} aria-label={label} onclick={() => count++}>
	{@render children?.()}
	{count}
</button>
