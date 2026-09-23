<script lang="ts">
	import { createMotion, Motion } from 'astra-motion';
	let open = $state(true);
	const parent = createMotion({
		initial: false,
		animate: 'shown',
		exit: 'hidden',
		variants: { shown: { opacity: 1 }, hidden: { opacity: 0 } },
		transition: { duration: 0.12, when: 'afterChildren', staggerChildren: 0.04 }
	});
	const child = parent.child({
		variants: { shown: { opacity: 1, x: 0 }, hidden: { opacity: 0, x: 20 } }
	});
	const sibling = parent.child({
		variants: { shown: { opacity: 1, x: 0 }, hidden: { opacity: 0, x: 20 } }
	});
	const outer = parent.transition;
	const inner = child.transition;
	const siblingExit = sibling.transition;
</script>

<section>
	<h2>Variants</h2>
	<button id="variant-toggle" onclick={() => (open = !open)}>Toggle variants</button>
	{#if open}<div id="variant-parent" {...parent.props} transition:outer>
			<div id="variant-child" {...child.props} transition:inner|global>Child</div>
			<div id="variant-sibling" {...sibling.props} transition:siblingExit|global>Sibling</div>
		</div>{/if}
	<Motion motion={{ initial: false, animate: 'shown', variants: { shown: { opacity: 1 } } }}
		><Motion id="implicit-child" motion={{ variants: { shown: { opacity: 0.6 } } }}
			>Implicit child SSR</Motion
		></Motion
	>
</section>
