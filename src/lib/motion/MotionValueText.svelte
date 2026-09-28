<script lang="ts">
	import { untrack } from 'svelte';
	import type { MotionValue } from 'motion-dom';
	import { readActivityState } from './activity-scope.js';
	let {
		value
	}: { value: MotionValue<string> | MotionValue<number> | MotionValue<string | number> } = $props();
	let latest = $state<string | number>(untrack(() => value.get()));
	const active = readActivityState();
	function subscribe() {
		if (!active()) return;
		latest = value.get();
		return value.on('change', (next) => (latest = next));
	}
	$effect(subscribe);
</script>

{latest}
