<script lang="ts">
	import { createInView, type InViewOptions } from '../motion/in-view.svelte.js';
	let { options = {} }: { options?: InViewOptions } = $props();
	let settings = $state<InViewOptions>({});
	let target = $state<HTMLDivElement>();
	let generation = $state(0);
	let visible = $state(true);
	const visibility = createInView(
		() => target,
		() => ({ ...options, ...settings })
	);

	export function configure(value: InViewOptions) {
		settings = value;
	}
	export function replace() {
		generation++;
	}
	export function hide() {
		visible = false;
	}
	export function read() {
		return visibility.current;
	}
</script>

{#if visible}
	{#key generation}
		<div bind:this={target} data-testid="in-view-target">Target</div>
	{/key}
{/if}
<output data-testid="in-view-current">{String(visibility.current)}</output>
