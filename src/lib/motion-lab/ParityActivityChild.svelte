<script lang="ts">
	import { useActivity, useActivityEffect } from '../motion/activity-context.svelte.js';
	import ParityPresenceChild from './ParityPresenceChild.svelte';
	let {
		pulse,
		onSetup,
		onCleanup,
		onOrdinary,
		hold = 45
	}: {
		pulse: number;
		onSetup?: () => void;
		onCleanup?: () => void;
		onOrdinary?: (pulse: number) => void;
		hold?: number;
	} = $props();
	const activity = useActivity();
	useActivityEffect(() => {
		onSetup?.();
		return () => onCleanup?.();
	});
	function ordinaryEffect() {
		onOrdinary?.(pulse);
	}
	$effect(ordinaryEffect);
</script>

<ParityPresenceChild id="activity-input" {hold} />
<span data-activity-active>{String(activity.active)}</span>
<span data-activity-phase>{activity.phase}</span>
