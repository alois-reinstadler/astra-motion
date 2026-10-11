<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import {
		AnimatePresence,
		MotionConfig,
		motion,
		createLayoutState
	} from '../../src/lib/motion/index.js';
	let { staged = false }: { staged?: boolean } = $props();
	let requested = $state({ columns: 10, items: Array.from({ length: 30 }, (_, id) => id) });
	const scene = createLayoutState(
		untrack(() => ({ columns: requested.columns, items: [...requested.items] }))
	);
	const items = $derived(staged ? scene.current.items : requested.items);
	let text = $state(0);
	export function read() {
		return [requested.columns, ...requested.items];
	}
	export function unrelated() {
		text++;
	}
	export function reverse() {
		requested.items.reverse();
	}
	export function request(nested = false) {
		const change = () => {
			requested = {
				columns: 5,
				items: requested.items.toReversed().filter((id) => id !== 0 && id !== 5)
			};
			if (staged) scene.set({ columns: requested.columns, items: [...requested.items] });
		};
		if (nested) flushSync(() => flushSync(change));
		else change();
	}
	export function splice() {
		requested.items.splice(0, 1);
	}
	let resolve!: (value: boolean) => void;
	const promise = new Promise<boolean>((done) => {
		resolve = done;
	});
	export function resolveAwait() {
		resolve(true);
	}
</script>

<MotionConfig reducedMotion="never">
	<div data-async-container>
		{#await promise}<div data-await-pending style="height: 30px">Pending</div>{:then}<div
				data-await-ready
				style="height: 100px"
			>
				Ready
			</div>{/await}
	</div>
	<div class="grid" style:grid-template-columns={`repeat(${requested.columns},minmax(0,1fr))`}>
		<AnimatePresence {items} key={(id) => id} initial={false} mode="popLayout">
			{#snippet children(id)}
				<motion.div
					class="cell"
					data-cell={id}
					layout="position"
					initial={false}
					exit={{ opacity: 0 }}
					transition={{ layout: { duration: 0.35, ease: 'linear' }, opacity: { duration: 0.18 } }}
					>{id}</motion.div
				>
			{/snippet}
		</AnimatePresence>
	</div>
</MotionConfig>
<span data-unrelated>{text}</span>
