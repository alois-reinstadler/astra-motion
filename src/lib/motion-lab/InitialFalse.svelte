<script lang="ts">
	import { createMotion } from '$lib/motion/motion.svelte.js';
	let { intro = false }: { intro?: boolean } = $props();
	let reduced = $state(false);
	let open = $state(true);
	const binding = createMotion(() => ({
		initial: intro ? { x: 0, opacity: 0 } : false,
		reducedMotion: reduced ? 'always' : 'never',
		exit: { x: -80, opacity: 0 },
		animate: { x: [0, 20, 80], opacity: [0, 0.5, 1] },
		transition: { duration: 0.4, ease: 'linear' }
	}));
	const transition = binding.transition;
	export function reduce() {
		reduced = true;
	}
	export function hide() {
		open = false;
	}
	export function stop() {
		binding.stop();
	}
	export function run() {
		return binding.animate({ x: 160, opacity: 1 }, { duration: 0.2 });
	}
</script>

{#if open}
	<div {...binding.props} data-testid="initial-false" transition:transition>
		Already in its final state
	</div>
{/if}
