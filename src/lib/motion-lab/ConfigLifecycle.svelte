<script lang="ts">
	import { untrack } from 'svelte';
	import MotionConfig from '$lib/motion/MotionConfig.svelte';
	import type { ReducedMotion } from '$lib/motion/policy.js';
	import type { LayoutOptions } from '$lib/motion/layout.js';
	import ConfigParticipant from './ConfigParticipant.svelte';
	let { initialPolicy = 'never' }: { initialPolicy?: ReducedMotion } = $props();
	let policy = $state(untrack(() => initialPolicy));
	let changed = $state(false);
	let enabled = $state(true);
	let shared = $state('first');
	let mode = $state<LayoutOptions['mode']>('both');
	export function reduce(value: ReducedMotion) {
		policy = value;
	}
	export function change() {
		changed = !changed;
	}
	export function projection(value: boolean) {
		enabled = value;
	}
	export function identity(value: string, nextMode: LayoutOptions['mode']) {
		shared = value;
		mode = nextMode;
	}
</script>

<MotionConfig reducedMotion={policy} transition={{ duration: 0.8, ease: 'linear' }}>
	<ConfigParticipant prefix="outer" {changed} {enabled} {shared} {mode} />
	<MotionConfig reducedMotion="never">
		<ConfigParticipant prefix="nested" {changed} {enabled} {shared} {mode} />
	</MotionConfig>
</MotionConfig>
