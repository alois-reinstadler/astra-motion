<script lang="ts">
	import { onMount } from 'svelte';
	import { motion, stagger, useActivityEffect, useAnimationFrame } from '../motion/index.js';
	let {
		id = 'tab',
		onLifecycle
	}: { id?: string; onLifecycle?: (event: string, time: number) => void } = $props();
	let count = $state(0);
	let frames = $state(0);
	const report = (event: string) => onLifecycle?.(`${id}:${event}`, performance.now());
	onMount(() => {
		report('mount');
		return () => report('destroy');
	});
	useActivityEffect(() => {
		report('setup');
		return () => report('cleanup');
	});
	useAnimationFrame(() => frames++);
</script>

<motion.section
	data-verification-tab={id}
	initial="visible"
	animate="visible"
	exit="hidden"
	variants={{
		visible: { opacity: 1 },
		hidden: { opacity: 0.8, transition: { delayChildren: stagger(0.09), duration: 0.05 } }
	}}
	style="width: 220px; height: 150px; margin: 0; background: rgb(240, 245, 250);"
>
	<button onclick={() => count++}>Increment {id}: {count}</button>
	<input aria-label={`${id} draft`} />
	<output data-verification-clock={id}>{frames}</output>
	<ul style="margin: 0; padding: 0; list-style: none;">
		{#each [0, 1, 2] as index (index)}
			<motion.li
				data-verification-item={`${id}-${index}`}
				variants={{
					visible: { opacity: 1 },
					hidden: { opacity: 0, transition: { duration: 0.08, ease: 'linear' } }
				}}
				onAnimationComplete={(definition) => {
					if (definition === 'hidden') report(`exit-${index}`);
				}}
			>
				Item {index}
			</motion.li>
		{/each}
	</ul>
</motion.section>
