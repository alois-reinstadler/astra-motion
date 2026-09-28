<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AnimateActivity,
		AnimatePresence,
		AnimateView,
		LayoutGroup,
		MotionConfig,
		Reorder,
		motion,
		startViewTransition,
		useDragControls
	} from 'astra-motion';
	import Probe from './Probe.svelte';
	let hydrated = $state(false);
	let visible = $state(true);
	let hidden = $state(false);
	let mounted = $state(true);
	let exited = $state(0);
	let page = $state('first');
	let outcome = $state('pending');
	let items = $state(['Alpha', 'Beta', 'Gamma']);
	let dragEnd = $state(0);
	const controls = useDragControls();
	onMount(() => {
		hydrated = true;
	});
	async function swap() {
		const transition = startViewTransition(async () => {
			await Promise.resolve();
			page = page === 'first' ? 'second' : 'first';
		});
		outcome = await transition.finished;
	}
</script>

<main data-hydrated={hydrated}>
	<MotionConfig transition={{ duration: 0.04 }} reducedMotion="never">
		<button onclick={() => (visible = !visible)}>Toggle presence</button>
		<output data-exited>{exited}</output>
		<AnimatePresence present={visible} onExitComplete={() => exited++}>
			<motion.div
				data-present
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}>Present</motion.div
			>
		</AnimatePresence>
		<button onclick={() => (hidden = !hidden)}>Toggle activity</button>
		<button onclick={() => (mounted = !mounted)}>Toggle owner</button>
		{#if mounted}
			<AnimateActivity mode={hidden ? 'hidden' : 'visible'}>
				<Probe />
			</AnimateActivity>
		{/if}
		<motion.svg viewBox="0 0 100 40" width="100" height="40"
			><motion.circle cx={10} cy={20} r={5}
				><motion.animate
					data-smil
					attributeName="cx"
					values="5;10;5"
					dur="1s"
					repeatCount="1"
				/></motion.circle
			></motion.svg
		>
		<button onclick={swap}>Swap view</button>
		<output data-outcome>{outcome}</output>
		<AnimateView name="consumer-view" enter={{ opacity: [0, 1] }}>
			{#snippet children(attach)}<section {@attach attach} data-view>{page}</section>{/snippet}
		</AnimateView>
		<button data-handle style="touch-action:none" onpointerdown={(event) => controls.start(event)}
			>Drag handle</button
		>
		<motion.div
			data-drag
			drag="x"
			dragControls={controls}
			dragListener={false}
			dragMomentum={false}
			dragElastic={0}
			dragConstraints={{ left: 0, right: 100 }}
			onDragEnd={() => dragEnd++}
			style="width:80px;height:40px;background:lightblue">Drag</motion.div
		>
		<output data-drag-end>{dragEnd}</output>
		<LayoutGroup id="consumer-list">
			<Reorder.Group
				values={items}
				onReorder={(next) => (items = next)}
				axis="y"
				style="width:160px;padding:0;list-style:none"
			>
				{#each items as item (item)}
					<Reorder.Item
						value={item}
						data-item={item}
						style="height:50px;margin:0;background:lightgray;position:relative;touch-action:none"
						>{item}</Reorder.Item
					>
				{/each}
			</Reorder.Group>
		</LayoutGroup>
	</MotionConfig>
</main>
