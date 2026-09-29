<script lang="ts">
	import { untrack } from 'svelte';
	import { AnimatePresence, motion } from '../motion/index.js';
	import type { PresenceMode } from '../motion/presence-model.js';
	type Item = { id: string; text: string };
	let {
		mode = 'sync',
		keyed = true,
		empty = false,
		onComplete
	}: {
		mode?: PresenceMode;
		keyed?: boolean;
		empty?: boolean;
		onComplete?: () => void;
	} = $props();
	const original = { id: 'a', text: 'Original A' };
	let value = $state.raw<Item | null | undefined>(untrack(() => (empty ? undefined : original)));
	export function select(id: string, text = id) {
		value = { id, text };
	}
	export function clear(undefinedValue = false) {
		value = undefinedValue ? undefined : null;
	}
	export function restore() {
		value = original;
	}
</script>

<AnimatePresence
	{value}
	key={keyed ? (item) => item.id : undefined}
	{mode}
	initial={false}
	onExitComplete={onComplete}
>
	{#snippet children(item)}
		<motion.div
			data-rc-presence={item.id}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.15 }}
		>
			{item.text}
		</motion.div>
	{/snippet}
</AnimatePresence>
