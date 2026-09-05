<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	let {
		mode = 'object',
		replacementDuration = 0.12
	}: { mode?: 'object' | 'custom' | 'labels'; replacementDuration?: number } = $props();
	let x = $state(0);
	let visible = $state(false);
	let disabled = $state(false);
	const binding = createMotion(() => ({
		initial: { x: -100, opacity: 1 },
		animate:
			mode === 'object'
				? { x, transitionEnd: { opacity: x === 0 ? 0.25 : 1 } }
				: mode === 'custom'
					? 'custom'
					: x === 0
						? 'first'
						: 'second',
		custom: x,
		variants: {
			custom: (value: unknown) => ({ x: Number(value) }),
			first: { x: 0 },
			second: { x: 180 }
		},
		exit: { x: -160, opacity: 0, transition: { duration: 0.3, ease: 'linear' } },
		transition: { duration: x === 0 ? 1.2 : replacementDuration, ease: 'linear' },
		reducedMotion: 'never',
		disabled
	}));
	const presence = binding.transition;
	export function retarget(value = 180) {
		x = value;
	}
	export function toggle() {
		visible = !visible;
	}
	export function refresh() {
		disabled = !disabled;
	}
</script>

{#if visible}
	<div data-testid="intro-retarget" {...binding.props} transition:presence></div>
{/if}

<style>
	div {
		width: 32px;
		height: 32px;
		background: royalblue;
	}
</style>
