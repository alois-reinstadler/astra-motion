<script lang="ts">
	import { Presence, presence } from '../motion/index.js';
	let selected = $state('a');
	export function select(value: string) {
		selected = value;
	}
</script>

<Presence value={selected}>
	{#snippet children(value)}
		{#if value !== 'a'}
			<div data-review="outer" data-value={value} transition:presence|global={{ duration: 40 }}>
				{value}
			</div>
		{/if}
	{/snippet}
</Presence>
