<!-- Motion 13.4.4 @ 33f6e72; attribution: tests/motion-baseline. -->
<script lang="ts">
	import { motion } from '../motion/index.js';
	let {
		all = false,
		margin = '0px',
		report = () => {}
	}: { all?: boolean; margin?: string; report?: (name: string) => void } = $props();
	let root = $state<HTMLDivElement>();
	let shown = $state(true);
	export function toggle() {
		shown = !shown;
	}
	function attachRoot(element: HTMLDivElement) {
		root = element;
		return () => {
			root = undefined;
		};
	}
</script>

<div
	{@attach attachRoot}
	data-testid="root"
	style="position:fixed;top:100px;left:100px;width:200px;height:200px;overflow:auto;"
>
	<div style="height:150px;"></div>
	{#if shown}
		<motion.div
			data-testid="target"
			initial={{ opacity: 0.2 }}
			whileInView={{ opacity: 1 }}
			transition={{ type: false }}
			viewport={{ root: () => root, amount: all ? 'all' : 'some', margin }}
			onViewportEnter={() => report('enter')}
			onViewportLeave={() => report('leave')}
			style={{ width: 100, height: 100 }}
		/>
	{/if}
	<div style="height:400px;"></div>
</div>
