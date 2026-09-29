<script lang="ts">
	import { untrack } from 'svelte';
	import AnimatePresence from './AnimatePresence.svelte';
	import TextVisual from './TextVisual.svelte';
	import type { TextSwapProps } from './text-types.js';
	let {
		text,
		as = 'span',
		effect: revealEffect = 'fade',
		split = 'whole',
		stagger = 0,
		direction = 'up',
		distance = 12,
		duration,
		locale = 'en',
		mode = 'sync',
		size = 'content',
		alternatives = [],
		overflow = 'clip',
		live = 'off',
		style,
		...attributes
	}: TextSwapProps = $props();
	const options = $derived({
		effect: revealEffect,
		split,
		stagger,
		direction,
		distance,
		duration,
		locale
	});
	let epoch = $state(0);
	let entrance = $state(false);
	let previous = untrack(() => text);
	let busy = false;
	function reconcile() {
		const next = text;
		const sequencing = mode;
		if (next === previous) return;
		previous = next;
		if (sequencing === 'sync' && busy) {
			// A third request discards obsolete visual work while preserving the host.
			epoch = untrack(() => epoch) + 1;
			entrance = false;
			busy = false;
		} else {
			entrance = true;
			busy = true;
		}
	}
	$effect.pre(reconcile);
</script>

<svelte:element
	this={as}
	{...attributes}
	style={size === 'fixed' ? `display: inline-block; ${style ?? ''}` : style}
>
	<span class="semantic" aria-live={live} aria-atomic="true">{text}</span>
	<span
		data-text-region={size}
		style:position="relative"
		style:display={size === 'content' ? 'inline-grid' : 'grid'}
		style:width={size === 'fixed' ? '100%' : undefined}
		style:height={size === 'fixed' ? '100%' : undefined}
		style:overflow={size === 'content' ? 'visible' : overflow}
	>
		{#if size === 'reserve'}
			{#each alternatives as alternative, index (index)}<span
					aria-hidden="true"
					style="grid-area: 1 / 1; visibility: hidden; pointer-events: none">{alternative}</span
				>{/each}
		{/if}
		{#key epoch}
			<AnimatePresence
				value={text}
				{mode}
				initial={false}
				onExitComplete={() => {
					busy = false;
				}}
			>
				{#snippet children(current)}
					<span style:grid-area="1 / 1" style:min-width="0">
						<TextVisual text={current} {options} {entrance} positioned={size !== 'content'} />
					</span>
				{/snippet}
			</AnimatePresence>
		{/key}
	</span>
</svelte:element>

<style>
	.semantic {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
