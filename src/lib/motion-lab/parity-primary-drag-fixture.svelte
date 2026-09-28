<script lang="ts">
	import { MotionConfig, motion, useDragControls, useMotionValue } from '../motion/index.js';
	let { authored = false }: { authored?: boolean } = $props();
	let axis = $state<boolean | 'x' | 'y'>('x');
	let policy = $state<'always' | 'never'>('never');
	const controls = useDragControls();
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const events: string[] = [];
	export function configure(next: typeof axis, reduced: typeof policy = policy) {
		axis = next;
		policy = reduced;
	}
	export function cancel() {
		controls.cancel();
	}
	export function inspect() {
		return { x: x.get(), y: y.get(), events: [...events] };
	}
</script>

<MotionConfig reducedMotion={policy}>
	<motion.div
		data-primary-drag
		class={authored ? 'authored-drag' : undefined}
		drag={axis}
		dragControls={controls}
		dragTransition={{ timeConstant: 200, power: 0.2 }}
		onDragStart={() => events.push('start')}
		onDragEnd={(event) => events.push(event.type)}
		style={{ x, y, width: 50, height: 50, backgroundColor: 'teal' }}
	/>
</MotionConfig>

<style>
	:global([data-primary-drag].authored-drag) {
		touch-action: manipulation;
		-webkit-user-select: all;
		user-select: all;
	}
</style>
