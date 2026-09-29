<script lang="ts">
	import { motion, stagger } from '$lib/motion/index.js';
	const items = ['Draft', 'Review', 'Publish'];
	let draft = $state('');
</script>

<motion.section
	initial={{ opacity: 0 }}
	animate={{ opacity: 1 }}
	exit="hidden"
	variants={{ hidden: { opacity: 0, transition: { when: 'afterChildren' } } }}
>
	<label>Draft <input bind:value={draft} /></label>
	<motion.ul variants={{ hidden: { transition: { delayChildren: stagger(0.1) } } }}>
		{#each items as item (item)}
			<motion.li variants={{ hidden: { opacity: 0 } }}>{item}</motion.li>
		{/each}
	</motion.ul>
</motion.section>
