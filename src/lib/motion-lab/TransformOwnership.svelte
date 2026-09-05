<script lang="ts">
	import { createMotion, type MotionOptions, type MotionTarget } from '../motion/motion.svelte.js';
	let { config = {} }: { config?: MotionOptions } = $props();
	const motion = createMotion(() => ({ initial: false, ...config }));
	export function animate(target: MotionTarget) {
		return motion.animate(target, { duration: 0 });
	}
</script>

<div data-transform-owner {...motion.props}>Owned transform</div>
