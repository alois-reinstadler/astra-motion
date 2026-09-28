<script lang="ts">
	import { untrack } from 'svelte';
	import AnimatePresence from '../motion/AnimatePresence.svelte';
	import type { PresenceMode } from '../motion/presence-model.js';
	import ParityPresenceChild from './ParityPresenceChild.svelte';
	let {
		mode = 'sync',
		hold = 40,
		onExitComplete,
		onExit,
		initialItems = ['a'],
		anchorX = 'left',
		anchorY = 'top'
	}: {
		mode?: PresenceMode;
		hold?: number | null;
		onExitComplete?: () => void;
		onExit?: (id: string) => void;
		initialItems?: string[];
		anchorX?: 'left' | 'right';
		anchorY?: 'top' | 'bottom';
	} = $props();
	let items = $state.raw(untrack(() => initialItems.map((id) => ({ id, label: id }))));
	let custom = $state(1);
	const removals: Record<string, () => void> = {};
	function capture(id: string, complete: () => void) {
		removals[id] = complete;
	}
	export function select(ids: string[]) {
		items = ids.map((id) => ({ id, label: id }));
	}
	export function rename(id: string, label: string) {
		items = items.map((item) => (item.id === id ? { ...item, label } : item));
	}
	export function setCustom(value: number) {
		custom = value;
	}
	export function release(id: string) {
		removals[id]?.();
	}
	export function removal(id: string) {
		return removals[id];
	}
</script>

<div style="position: relative; width: 320px;" data-presence-list>
	<AnimatePresence
		{items}
		key={(item) => item.id}
		{mode}
		{custom}
		{onExitComplete}
		{anchorX}
		{anchorY}
	>
		{#snippet children(item)}
			<ParityPresenceChild id={item.id} label={item.label} {hold} {capture} {onExit} />
		{/snippet}
	</AnimatePresence>
</div>
