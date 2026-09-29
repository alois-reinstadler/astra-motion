<script lang="ts">
	import { motion } from 'astra-motion/state/lite';
	let open = $state(true);
	const panel = motion.bind({
		initial: { opacity: 0, y: 12 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -12 },
		transition: { duration: 0.24 }
	});
	const enterExit = panel.transition;
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
	<section {...panel.props} transition:enterExit>Still a section.</section>
{/if}
