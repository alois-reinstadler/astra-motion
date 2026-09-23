<script lang="ts">
	import { untrack } from 'svelte';
	import { createMotion } from '../motion/motion.svelte.js';
	import { createLayout } from '../motion/layout.js';
	import { observeMotionConfig, readMotionConfig } from '../motion/config.js';
	let { name, report }: { name: string; report: (name: string) => void } = $props();
	const config = readMotionConfig();
	const motion = createMotion({
		initial: false,
		animate: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: 100 }
	});
	const layout = createLayout();
	const transition = motion.transition;
	$effect(() => untrack(() => observeMotionConfig(config, () => report(name))));
</script>

<div {...motion.props} data-testid={`${name}-motion`} transition:transition>
	{name}
</div>
<div data-testid={`${name}-layout`} {@attach layout()}>Layout</div>
