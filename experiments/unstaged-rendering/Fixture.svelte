<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import {
		AnimatePresence,
		MotionConfig,
		motion,
		createLayoutState
	} from '../../src/lib/motion/index.js';
	let { staged = false }: { staged?: boolean } = $props();
	let requested = $state.raw({ columns: 10, items: Array.from({ length: 30 }, (_, id) => id) });
	const scene = createLayoutState(untrack(() => requested));
	const items = $derived(staged ? scene.current.items : requested.items);
	let visible = $state(true);
	let text = $state(0);
	export function unrelated() {
		text++;
	}
	export function reverse() {
		requested = { ...requested, items: requested.items.toReversed() };
	}
	let resolve!: (value: boolean) => void;
	const promise = new Promise<boolean>((done) => {
		resolve = done;
	});
	export function request(nested = false) {
		const change = () => {
			requested = {
				columns: 5,
				items: requested.items.toReversed().filter((id) => id !== 0 && id !== 5)
			};
			if (staged) scene.set(requested);
		};
		if (nested) flushSync(() => flushSync(change));
		else change();
	}
	export function resolveAwait() {
		resolve(true);
	}
	export function hideNative() {
		visible = false;
	}
</script>

<MotionConfig reducedMotion="never">
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
<div data-async-container>
	{#await promise}<div data-await-pending style="height: 30px">Pending</div>{:then}<div
			data-await-ready
			style="height: 100px"
		>
			Ready
		</div>{/await}
	<div data-await-marker>Marker</div>
</div>
<div data-native-container>
	{#if visible}<div data-native out:fade={{ duration: 80 }} style="height: 60px">Native</div>{/if}
	<div data-native-marker>Marker</div>
</div>
