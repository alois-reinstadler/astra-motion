<script lang="ts">
	import { createMotion } from '../motion/lite.svelte.js';
	import type { MotionBinding } from '../motion/motion.svelte.js';
	let open = $state(true);
	let changed = $state(false);
	const parent = createMotion(() => ({
		initial: false,
		animate: changed ? 'shifted' : 'visible',
		exit: 'hidden',
		variants: { visible: { opacity: 1 }, shifted: { opacity: 0.8 }, hidden: { opacity: 0 } },
		transition: { duration: 0.2, when: 'afterChildren' },
		reducedMotion: 'never'
	}));
	const child = parent.child({
		variants: {
			visible: { x: 0, opacity: 1 },
			shifted: { x: 80, opacity: 1 },
			hidden: { x: -20, opacity: 0 }
		},
		transition: { duration: 0.2 },
		reducedMotion: 'never'
	});
	// The same binding works with custom components accepting MotionBinding.
	const binding: MotionBinding = parent;
	const presence = binding.transition;
	const childPresence = child.transition;
	export function toggle() {
		open = !open;
	}
	export function change() {
		binding.update(() => {
			changed = !changed;
		});
	}
</script>

{#if open}
	<div {...binding.props} data-lite="parent" transition:presence>
		<p {...child.props} data-lite="child" transition:childPresence>Light native state</p>
	</div>
{/if}
