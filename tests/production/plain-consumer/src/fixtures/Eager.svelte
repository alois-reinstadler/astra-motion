<script lang="ts">
	import { onMount } from 'svelte';
	import { motion } from 'astra-motion';
	let hydrated = $state(false);
	let target = $state(20);
	onMount(() => {
		hydrated = true;
	});
</script>

<main data-hydrated={hydrated}>
	<button onclick={() => (target = 80)}>Animate</button>
	<motion.div
		data-box
		initial={false}
		animate={{ x: target, opacity: 1 }}
		transition={{ duration: 0.05 }}>Eager motion</motion.div
	>
</main>
