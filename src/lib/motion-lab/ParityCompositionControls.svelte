<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { AnimateActivity, useAnimationControls } from '../motion/index.js';
	import Child from './ParityCompositionControlsChild.svelte';
	let {
		ancestor = false,
		initialMode = 'visible',
		onStart,
		onComplete,
		onResolve
	}: {
		ancestor?: boolean;
		initialMode?: 'visible' | 'hidden';
		onStart?: (definition: unknown) => void;
		onComplete?: (definition: unknown) => void;
		onResolve?: (
			custom: unknown,
			current: Record<string, string | number>,
			velocity: Record<string, string | number>
		) => void;
	} = $props();
	const outside = useAnimationControls();
	let child: ReturnType<typeof useAnimationControls> | undefined;
	let mode = $state<'visible' | 'hidden'>(untrack(() => initialMode));
	let attached = $state(true);
	onMount(() => {
		if (ancestor) void outside.start('mounted');
	});
	export const controls = () => (ancestor ? outside : child!);
	export function show() {
		mode = 'visible';
	}
	export function hide() {
		mode = 'hidden';
	}
	export function removeChild() {
		attached = false;
	}
</script>

<AnimateActivity {mode} data-composition-controls-host>
	{#if attached}
		<Child
			controls={ancestor ? outside : undefined}
			ready={(value) => (child = value)}
			{onStart}
			{onComplete}
			{onResolve}
		/>
	{/if}
</AnimateActivity>
