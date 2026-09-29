<script lang="ts">
	import { untrack } from 'svelte';
	import type { FollowValueOptions, MotionValue } from 'motion-dom';
	import { useFollowValue } from '../motion/value-hooks.svelte.js';
	import { useWillChange } from '../motion/will-change.svelte.js';
	import { provideActivityState } from '../motion/activity-scope.js';
	import * as motion from '../motion/elements/index.js';
	let { source }: { source: MotionValue<number> } = $props();
	let active = $state(true);
	provideActivityState(() => active);
	let selected = $state.raw(untrack(() => source));
	let options = $state<FollowValueOptions>({ type: 'tween', duration: 0.08, ease: 'linear' });
	const follower = useFollowValue(
		() => selected,
		() => options
	);
	const direct = useFollowValue('0px', () => options);
	const willChange = useWillChange();
	export function api() {
		return { follower, direct, willChange };
	}
	export function select(value: MotionValue<number>) {
		selected = value;
	}
	export function configure(value: FollowValueOptions) {
		options = value;
	}
	export function show(value: boolean) {
		active = value;
	}
</script>

<motion.div
	data-will-change
	style={{ willChange }}
	animate={{ x: 30 }}
	transition={{ duration: 0.05 }}
/>
