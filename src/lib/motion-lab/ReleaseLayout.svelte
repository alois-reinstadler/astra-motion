<script lang="ts">
	import { AnimatePresence, MotionConfig, motion } from '../motion/index.js';

	let columns = $state(10);
	let items = $state(Array.from({ length: 30 }, (_, id) => id));
	let text = $state(0);
	let resolveSibling!: (value: boolean) => void;
	const sibling = new Promise<boolean>((resolve) => {
		resolveSibling = resolve;
	});

	export function combined() {
		columns = 5;
		items = items.toReversed().filter((id) => id !== 0 && id !== 5);
	}
	export function reverse() {
		items.reverse();
	}
	export function splice() {
		items.splice(items.indexOf(0), 1);
	}
	export function remove() {
		items = items.filter((id) => id !== 0 && id !== 5);
	}
	export function resolve() {
		resolveSibling(true);
	}
	export function unrelated() {
		text++;
	}
</script>

<MotionConfig reducedMotion="never">
	<section data-release-layout>
		<div data-release-async>
			{#await sibling}
				<div style="height:30px">Pending</div>
			{:then}
				<div data-release-ready style="height:100px">Ready</div>
			{/await}
		</div>
		<div
			data-release-grid
			style="position:relative;display:grid;width:600px;gap:4px"
			style:grid-template-columns={`repeat(${columns},minmax(0,1fr))`}
		>
			<AnimatePresence {items} key={(id) => id} initial={false} mode="popLayout">
				{#snippet children(id)}
					<motion.div
						data-release-cell={id}
						layout="position"
						initial={false}
						exit={{ opacity: 0 }}
						transition={{
							layout: { duration: 0.35, ease: 'linear' },
							opacity: { duration: 0.5 }
						}}
						style="box-sizing:border-box;height:24px;font:12px/24px sans-serif">{id}</motion.div
					>
				{/snippet}
			</AnimatePresence>
		</div>
	</section>
</MotionConfig>
<span data-release-unrelated style="position:fixed;width:40px;height:20px">{text}</span>
