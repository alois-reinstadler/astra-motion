<script lang="ts">
	import { untrack } from 'svelte';
	import AnimateActivity from '../motion/AnimateActivity.svelte';
	import type { ActivityMode } from '../motion/activity-context.svelte.js';
	import ParityActivityChild from './ParityActivityChild.svelte';
	let {
		initialMode = 'visible',
		onSetup,
		onCleanup,
		onOrdinary,
		onExitComplete,
		layoutMode = 'preserve'
	}: {
		initialMode?: ActivityMode;
		onSetup?: () => void;
		onCleanup?: () => void;
		onOrdinary?: (pulse: number) => void;
		onExitComplete?: () => void;
		layoutMode?: 'preserve' | 'pop';
	} = $props();
	let mode = $state<ActivityMode>(untrack(() => initialMode));
	let pulse = $state(0);
	export function show() {
		mode = 'visible';
	}
	export function hide() {
		mode = 'hidden';
	}
	export function update() {
		pulse++;
	}
</script>

<div style="position: relative;">
	<AnimateActivity {mode} {layoutMode} {onExitComplete} data-activity-host>
		<ParityActivityChild {pulse} {onSetup} {onCleanup} {onOrdinary} />
	</AnimateActivity>
	<div data-activity-sibling>Sibling</div>
</div>
