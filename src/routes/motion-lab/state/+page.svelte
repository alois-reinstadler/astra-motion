<script lang="ts">
	import MotionConfig from '$lib/motion/MotionConfig.svelte';
	import StateLab from '$lib/motion-lab/StateLab.svelte';
	let reduced = $state(false);
</script>

<MotionConfig
	reducedMotion={reduced ? 'always' : 'user'}
	transition={{ type: 'spring', stiffness: 380, damping: 32 }}
>
	<StateLab bind:reduced />
</MotionConfig>
