<script lang="ts">
	import { createMotion } from '../motion/lite.svelte.js';
	let open = $state(true);
	let value = $state(0);
	let label = $state('first');
	const motion = createMotion(() => ({
		initial: false,
		animate: { x: value },
		transition: { duration: 0.6, ease: 'linear' },
		reducedMotion: 'never'
	}));
	export function show(next: boolean) {
		open = next;
	}
	export function change(next: number) {
		value = next;
	}
	export function rename() {
		label = 'changed';
	}
</script>

{#if open}<div {...motion.props} data-remount={label}>Remounted current state</div>{/if}
