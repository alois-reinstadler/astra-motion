<script lang="ts">
	import { createMotion } from 'astra-motion/state';
	let open = $state(true);
	const panel = createMotion({
		initial: 'hidden',
		animate: 'visible',
		exit: 'hidden',
		variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
		transition: { duration: 0.2, when: 'afterChildren', staggerChildren: 0.06 }
	});
	const title = panel.child({
		variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
	});
	const panelExit = panel.transition;
	const titleExit = title.transition;
</script>

<button onclick={() => (open = !open)}>Toggle group</button>
{#if open}
	<section {...panel.props} transition:panelExit>
		<h2 {...title.props} transition:titleExit|global>One coordinated branch.</h2>
	</section>
{/if}
