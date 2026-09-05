<script lang="ts">
	import { Presence, presence } from 'astra-motion/presence';
	let chapter = $state(1);
</script>

<button onclick={() => chapter++}>Next chapter</button>
<Presence value={chapter}>
	{#snippet children(current)}
		<h2 transition:presence={{ duration: 240 }}>Chapter {current}</h2>
	{/snippet}
</Presence>
