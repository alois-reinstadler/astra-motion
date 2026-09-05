<script lang="ts">
	import { createMotion } from 'astra-motion/state';
	import { MotionConfig } from 'astra-motion';
	import NativeCard from './NativeCard.svelte';
	let target = $state(40);
	let attached = $state(true);
	const card = createMotion(() => ({
		initial: false,
		animate: { x: target, opacity: 0.75 },
		transition: { duration: 0.18 }
	}));
</script>

<h1>SSR and a native custom component</h1>
<button onclick={() => (target = target === 40 ? 120 : 40)}>Retarget</button>
<button onclick={() => (attached = !attached)}>Toggle binding</button>
<NativeCard motion={attached ? card : undefined}
	><h2>Retained content</h2>
	<input aria-label="Draft" value="Unchanged draft" /></NativeCard
>
<MotionConfig reducedMotion="always"
	><p>Configuration export renders on the server.</p></MotionConfig
>
