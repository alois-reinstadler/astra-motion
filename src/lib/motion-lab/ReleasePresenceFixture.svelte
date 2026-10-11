<script lang="ts">
	import AnimatePresence from '../motion/AnimatePresence.svelte';
	import ReleasePresenceChild from './ReleasePresenceChild.svelte';
	let { mode = 'sync', hold = 100 }: { mode?: 'sync' | 'wait'; hold?: number } = $props();
	let items = $state(['a']);
	let custom = $state(1);
	const reads: Record<string, { presence: number; isPresent: number; data: number }> = {};
	const completed: string[] = [];
	const cancelled: string[] = [];
	let exitCompletions = 0;
	function onRead(id: string, field: 'presence' | 'isPresent' | 'data') {
		reads[id] ??= { presence: 0, isPresent: 0, data: 0 };
		reads[id][field]++;
	}
	export function select(next: string[]) {
		items = next;
	}
	export function setCustom(next: number) {
		custom = next;
	}
	export function effects(id = 'a') {
		return { ...reads[id] };
	}
	export function completions() {
		return { manual: [...completed], exits: exitCompletions };
	}
	export function cancellations() {
		return [...cancelled];
	}
</script>

<AnimatePresence {items} key={(id) => id} {mode} {custom} onExitComplete={() => exitCompletions++}>
	{#snippet children(id)}
		<ReleasePresenceChild
			{id}
			{hold}
			{onRead}
			onComplete={(id) => completed.push(id)}
			onCancel={(id) => cancelled.push(id)}
		/>
	{/snippet}
</AnimatePresence>
