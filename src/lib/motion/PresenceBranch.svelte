<script lang="ts" generics="T">
	import { onDestroy, untrack, type Snippet } from 'svelte';
	let {
		value,
		register,
		children
	}: {
		value: T;
		register: (value: T) => () => void;
		children: Snippet<[T]>;
	} = $props();
	const complete = untrack(() => register(value));
	onDestroy(complete);
</script>

{@render children(value)}
