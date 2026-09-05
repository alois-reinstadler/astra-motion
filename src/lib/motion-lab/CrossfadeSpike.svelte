<script lang="ts">
	import { crossfade, fade } from 'svelte/transition';
	const [send, receive] = crossfade({
		duration: 240,
		fallback: (node) => fade(node, { duration: 240 })
	});
	let expanded = $state(false);
	let shifted = $state(false);
	export function swap() {
		expanded = !expanded;
	}
	export function reflow() {
		shifted = !shifted;
	}
</script>

{#snippet pairs(large: boolean)}
	<section data-crossfade-view={large ? 'large' : 'small'}>
		{#each ['image', 'title'] as id (id)}
			<div
				data-crossfade-pair={id}
				in:receive|global={{ key: id }}
				out:send|global={{ key: id }}
				style:width={`${id === 'image' ? (large ? 180 : 60) : large ? 220 : 100}px`}
				style:height={`${id === 'image' ? (large ? 96 : 48) : large ? 40 : 22}px`}
			>
				{id}
			</div>
		{/each}
	</section>
{/snippet}

{#if expanded}
	{@render pairs(true)}
{:else}
	{@render pairs(false)}
{/if}

<div
	data-crossfade-reflow
	in:receive={{ key: 'existing' }}
	out:send={{ key: 'existing' }}
	style:margin-left={`${shifted ? 120 : 0}px`}
	style:width="40px"
	style:height="20px"
>
	existing
</div>
