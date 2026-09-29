<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	import { provideActivityState } from '$lib/motion/activity-scope.js';
	let {
		axis = 'height',
		boxSizing = 'content-box',
		reducedMotion = 'never'
	}: {
		axis?: 'height' | 'width';
		boxSizing?: 'content-box' | 'border-box';
		reducedMotion?: 'never' | 'always';
	} = $props();
	let shown = $state(true);
	let active = $state(true);
	provideActivityState(() => active);
	const options = () => ({
		initial: { [axis]: 0, opacity: 0 },
		animate: { [axis]: 'auto', opacity: 1 },
		exit: { [axis]: 0, opacity: 0 },
		// Leave an observable interpolation window across all three browser engines.
		transition: { duration: 0.6 },
		reducedMotion,
		style: { overflow: 'hidden', boxSizing, padding: '12px', border: '2px solid', scale: 1.1 }
	});
	const panel = motion.bind(options);
	const reveal = panel.transition;
	export function show(value: boolean) {
		shown = value;
	}
	export function suspend() {
		active = false;
	}
</script>

<div style="width: 240px">
	{#if shown}
		<div data-intrinsic="native" {...panel.props} transition:reveal|global>
			<p style="margin: 0; height: 100px; width: 100px">Retained accordion answer</p>
		</div>
		<motion.div data-intrinsic="component" {...options()}>
			<p style="margin: 0; height: 100px; width: 100px">Retained accordion answer</p>
		</motion.div>
	{/if}
</div>
