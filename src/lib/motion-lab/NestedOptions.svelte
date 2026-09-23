<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	import Motion from '../motion/MotionComponent.svelte';
	import { motionValue } from '../motion/values.js';

	const options = $state({
		initial: false as const,
		animate: { x: 0 },
		transition: { duration: 0 }
	});
	const object = createMotion(options);
	const getter = createMotion(() => options);
	const value = motionValue(0.5);
	const variants = $state({ active: { x: [0, 0] } });
	const variant = createMotion({
		initial: false,
		animate: 'active',
		variants,
		style: { opacity: value },
		transition: { duration: 0 }
	});
	const custom = $state({ x: 0 });
	const dynamic = createMotion({
		initial: false,
		animate: 'active',
		custom,
		variants: { active: (data) => ({ x: data.x }) },
		transition: { duration: 0 }
	});

	export function mutate(x: number) {
		options.animate.x = x;
		variants.active.x[1] = x;
		custom.x = x;
	}
	export function replace(x: number) {
		options.animate = { x };
	}
	export function external() {
		return value;
	}
</script>

<div data-nested-object {...object.props}>Object</div>
<div data-nested-getter {...getter.props}>Getter</div>
<Motion data-nested-component motion={options}>Component</Motion>
<div data-nested-variant {...variant.props}>Variant</div>
<div data-nested-custom {...dynamic.props}>Custom</div>
