<script lang="ts">
	import { motion } from '../motion/index.js';
	let width = $state(100);
	let dependency = $state(0);
	let crossfade = $state(false);
	let anchor = $state<{ x: number; y: number } | false>({ x: 1, y: 0 });
	let scroll = $state(false);
	const measurements: { width: number; previous?: number }[] = [];
	const events: string[] = [];
	export function resize(next: number, updateDependency = false) {
		width = next;
		if (updateDependency) dependency++;
	}
	export function configure(nextAnchor: typeof anchor, nextCrossfade: boolean) {
		anchor = nextAnchor;
		crossfade = nextCrossfade;
		scroll = !scroll;
	}
	export function inspect() {
		return { measurements: [...measurements], events: [...events] };
	}
</script>

<motion.div
	data-parity-layout="dependency"
	layout
	layoutDependency={dependency}
	onBeforeLayoutMeasure={() => events.push('before')}
	onLayoutMeasure={(box, previous) => {
		events.push('measure');
		measurements.push({
			width: box.x.max - box.x.min,
			previous: previous ? previous.x.max - previous.x.min : undefined
		});
	}}
	style={{ width, height: 40 }}
	transition={{ duration: 0.08 }}
/>
<motion.div
	data-parity-layout="configured"
	layout
	layoutId="advanced-layout-review"
	layoutAnchor={anchor}
	layoutCrossfade={crossfade}
	layoutScroll={scroll}
	style={{ width, height: 40 }}
	transition={{ duration: 0.08 }}
/>
<motion.div
	data-parity-layout="measure-only"
	drag="x"
	layoutDependency={0}
	layoutScroll={scroll}
	style={{ width: 100, height: 40 }}
/>
