<script lang="ts">
	import { onMount } from 'svelte';
	import { useAnimate } from 'astra-motion/animate';
	let hydrated = $state(false);
	const [scope, animate] = useAnimate();
	onMount(() => {
		hydrated = true;
	});
</script>

<main data-hydrated={hydrated} {@attach scope.attach}>
	<button onclick={() => animate('[data-box]', { opacity: [0, 1] }, { duration: 0.05 })}
		>Animate</button
	>
	<div data-box style="opacity:0">Scoped playback</div>
	<output data-active>{scope.active}</output>
</main>
