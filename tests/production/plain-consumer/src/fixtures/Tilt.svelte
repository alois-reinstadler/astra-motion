<script lang="ts">
	import { onMount } from 'svelte';
	import { Tilt } from 'astra-motion/tilt';
	let hydrated = $state(false);
	let disabled = $state(false);
	let clicks = $state(0);
	onMount(() => {
		hydrated = true;
	});
</script>

<main data-hydrated={hydrated}>
	<button onclick={() => (disabled = !disabled)}>Toggle tilt</button>
	<Tilt
		data-tilt-fixture
		style="width: 320px; padding: 24px; margin: 24px"
		perspective={900}
		maxRotateX={8}
		maxRotateY={10}
		spring={{ stiffness: 400, damping: 40 }}
		{disabled}
	>
		<h1>Packed pointer tilt</h1>
		<label>Retained tilt input <input /></label>
		<button onclick={() => (clicks += 1)}>Native action</button>
		<output data-clicks>{clicks}</output>
	</Tilt>
</main>
