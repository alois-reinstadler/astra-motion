<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { AnimateActivity, motion, stagger, type Transition } from '../motion/index.js';
	let {
		method = 'function',
		perValue = false,
		reverse = false,
		via = 'variant',
		scenario = 'stagger',
		onMove
	}: {
		method?: 'function' | 'number';
		perValue?: boolean;
		reverse?: boolean;
		via?: 'variant' | 'prop';
		scenario?: 'stagger' | 'delay' | 'late' | 'activity' | 'cohort';
		onMove?: (id: number, value: number) => void;
	} = $props();
	let label = $state('hidden'),
		count = $state(2),
		mode = $state<'visible' | 'hidden'>('visible');
	const orchestration = $derived<Transition>(
		scenario === 'delay'
			? { delayChildren: 0.3 }
			: method === 'number'
				? { staggerChildren: 0.25, staggerDirection: reverse ? -1 : 1 }
				: { delayChildren: stagger(0.25, { from: reverse ? 'last' : 'first' }) }
	);
	const childTransition = $derived<Transition>(
		perValue ? { x: { duration: 0.08, ease: 'linear' } } : { duration: 0.08, ease: 'linear' }
	);
	const variants = $derived({ hidden: { x: 0 }, visible: { x: 100, transition: childTransition } });
	export function show() {
		label = 'visible';
	}
	export function add(amount = 1) {
		count += amount;
	}
	export function activity(next: 'visible' | 'hidden') {
		mode = next;
	}
</script>

<AnimateActivity {mode}>
	<motion.div
		data-upstream-orchestration="parent"
		initial="hidden"
		animate={label}
		variants={{
			hidden: { opacity: 0.2 },
			visible: {
				opacity: 1,
				...(via === 'variant'
					? { transition: { duration: scenario === 'late' ? 1 : 0, ...orchestration } }
					: {})
			}
		}}
		transition={via === 'prop' ? { duration: 0, ...orchestration } : undefined}
	>
		{#if scenario === 'cohort'}
			{#each Array.from({ length: count }, (_, id) => id) as id (id)}
				<motion.div
					data-upstream-child={id}
					{variants}
					onUpdate={(value) => onMove?.(id, Number(value.x))}
				/>
			{/each}
		{:else}
			<motion.div>
				{#each Array.from({ length: count }, (_, id) => id) as id (id)}
					<motion.div
						data-upstream-child={id}
						{variants}
						onUpdate={(value) => onMove?.(id, Number(value.x))}
					/>
				{/each}
			</motion.div>
		{/if}
		{#if scenario === 'delay'}
			<motion.div
				variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
				transition={{ type: false }}
			>
				<motion.div
					data-upstream-orchestration="grandchild"
					variants={{ hidden: { x: 0 }, visible: { x: 100 } }}
					transition={{ type: false }}
				/>
			</motion.div>
		{/if}
	</motion.div>
	{#if scenario === 'activity' && count > 2}
		<motion.div
			data-upstream-orchestration="late-control"
			initial={{ x: 0 }}
			animate={{ x: 100 }}
			transition={{ duration: 0.08, ease: 'linear' }}
		/>
	{/if}
</AnimateActivity>
