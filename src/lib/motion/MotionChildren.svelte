<script lang="ts">
	import { isMotionValue } from 'motion-dom';
	import MotionValueText from './MotionValueText.svelte';
	import type { MotionChildren } from './motion-children.js';
	let { children }: { children?: MotionChildren } = $props();
</script>

{#if typeof children === 'function'}
	{@render children()}
{:else if isMotionValue(children)}
	<MotionValueText value={children} />
{:else}
	{children ?? ''}
{/if}
