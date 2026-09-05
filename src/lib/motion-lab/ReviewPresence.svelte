<script lang="ts">
	import { Presence, presence } from '../motion/index.js';
	let selected = $state('a');
	export function select(value: string) {
		selected = value;
	}
</script>

<Presence value={selected}>
	{#snippet children(value)}
		<div data-review="outer" data-value={value} transition:presence={{ duration: 40 }}>
			<span data-review="inner" transition:presence={{ duration: 300 }}>{value}</span>
		</div>
	{/snippet}
</Presence>
