<script lang="ts">
	import { Motion, MotionConfig, createLayout } from '$lib/motion/index.js';
	let items = $state([1, 2, 3]);
	let color = $state('red');
	let clicks = $state(0);
	let ref = $state<HTMLElement | null>(null);
	const group = createLayout();
	export function remove(id: number) {
		items = items.filter((item) => item !== id);
	}
	export function restore() {
		items = [1, 2, 3];
	}
	export function reverse() {
		items = [...items].reverse();
	}
	export function recolor() {
		color = 'blue';
	}
	export function clicked() {
		return clicks;
	}
	export function element() {
		return ref;
	}
</script>

<MotionConfig transition={{ duration: 0.2, ease: 'linear' }} reducedMotion="never">
	<Motion
		as="button"
		data-testid="motion-component-button"
		bind:ref
		type="button"
		onclick={() => clicks++}
		style={`color:${color};width:40px;opacity:0.9`}
		motion={{ initial: { opacity: 0.2 }, animate: { opacity: 1 } }}>Click</Motion
	>
	<ul style="position:relative">
		{#each items as item (item)}
			<Motion
				as="li"
				data-testid={`motion-component-${item}`}
				motion={{
					initial: { opacity: 0 },
					animate: { opacity: 1 },
					exit: { opacity: 0 },
					layout: true,
					layoutGroup: group
				}}>{item}</Motion
			>
		{/each}
	</ul>
	<Motion as="input" aria-label="Motion input" value="native" motion={{ initial: false }} />
</MotionConfig>
