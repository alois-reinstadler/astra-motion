<script lang="ts">
	import {
		motion as nativeMotion,
		type MotionOptions,
		type MotionTarget
	} from '../motion/motion.svelte.js';
	let { config = {} }: { config?: MotionOptions } = $props();
	const motion = nativeMotion.bind(() => ({ initial: false, ...config }));
	export function animate(target: MotionTarget) {
		return motion.animate(target, { duration: 0 });
	}
</script>

<div data-transform-owner {...motion.props}>Owned transform</div>
