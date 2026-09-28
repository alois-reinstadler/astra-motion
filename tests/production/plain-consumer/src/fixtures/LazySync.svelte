<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from 'astra-motion/m';
	import { LazyMotion } from 'astra-motion/lazy';
	import { domAnimation } from 'astra-motion/features/dom-animation';
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
</script>

<main data-hydrated={hydrated}>
	<LazyMotion features={domAnimation} strict>
		<m.div
			data-box
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.05 }}>Synchronous features</m.div
		>
	</LazyMotion>
</main>
