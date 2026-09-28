<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		motion,
		useAnimate,
		useAnimationFrame,
		useMotionValue,
		useTime,
		useTransform
	} from 'astra-motion';
	const source = useMotionValue(2);
	const doubled = useTransform(() => source.get() * 2);
	const time = useTime();
	const [scope, animate] = useAnimate();
	let frames = 0;
	let destroyed = 0;
	useAnimationFrame(() => frames++);
	onDestroy(() => destroyed++);
	onMount(() => {
		window.__astra = {
			readTime: () => time.get(),
			frames: () => frames,
			set: (value) => source.set(value),
			read: () => doubled.get(),
			destroyed: () => destroyed,
			active: () => scope.active
		};
	});
</script>

<section {@attach scope.attach} data-probe>
	<input aria-label="Retained input" value="before hydration" />
	<motion.output data-derived children={doubled} />
	<button
		onclick={() =>
			animate('[data-owned]', { opacity: [1, 0.2, 1] }, { duration: 10, repeat: Infinity })}
		>Start owned animation</button
	>
	<div data-owned>Owned animation</div>
</section>
