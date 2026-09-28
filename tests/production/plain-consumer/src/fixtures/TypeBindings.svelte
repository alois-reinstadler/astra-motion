<script lang="ts">
	import {
		motion,
		m,
		AnimatePresence,
		AnimateActivity,
		MotionConfig,
		useMotionValue
	} from 'astra-motion';
	let input = $state<HTMLInputElement | null>(null);
	let path = $state<SVGPathElement | null>(null);
	let value = $state<number | null>(3);
	let checked = $state(false);
	let open = $state(false);
	let selected = $state('one');
	const opacity = useMotionValue(1);
	const FactoryInput = motion.create('input');
	const FactoryPath = m.create('path');
</script>

<MotionConfig
	transition={{ duration: 0.2 }}
	reducedMotion="user"
	nonce="test-nonce"
	transformPagePoint={(point) => ({ x: point.x / 2, y: point.y / 2 })}
>
	<FactoryInput type="number" bind:ref={input} {value} aria-label="Factory number" />
	<motion.input type="number" bind:value bind:ref={input} aria-label="Strict number" />
	<m.input type="checkbox" bind:checked aria-label="Strict checked" />
	<motion.details bind:open><summary>Strict details</summary>Content</motion.details>
	<motion.select bind:value={selected} aria-label="Strict selection"
		><option value="one">One</option></motion.select
	>
	<motion.svg viewBox="0 0 10 10"
		><FactoryPath bind:ref={path} d="M0 0L10 10" /><motion.path
			bind:ref={path}
			d="M0 0L10 10"
			initial={{ pathLength: 0 }}
			animate={{ pathLength: 1 }}
		/></motion.svg
	>
	<AnimatePresence
		items={[{ id: 'one' }]}
		key={(item) => item.id}
		mode="popLayout"
		custom={{ direction: 1 }}
		propagate
	>
		{#snippet children(item)}<motion.div layout exit={{ opacity: 0 }}>{item.id}</motion.div
			>{/snippet}
	</AnimatePresence>
	<AnimateActivity mode="hidden" layoutMode="pop"
		><motion.div style={{ opacity }} /></AnimateActivity
	>
</MotionConfig>
