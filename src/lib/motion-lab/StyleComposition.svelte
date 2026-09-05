<script lang="ts">
	import Card from '../components/ui/card/card.svelte';
	import { createMotion } from '../motion/motion.svelte.js';
	let wide = $state(false);
	let blue = $state(false);
	const surface = createMotion(() => ({
		initial: false,
		animate: { opacity: wide ? 0.3 : 1 },
		style: { borderRadius: 16 },
		layout: true,
		transition: { duration: 0.7, ease: 'linear' },
		reducedMotion: 'never'
	}));
	export function resize() {
		wide = true;
	}
	export function recolor() {
		blue = true;
	}
</script>

<Card
	motion={surface}
	data-style-composition
	style={`width:${wide ? 420 : 180}px;height:100px;background-color:${blue ? 'blue' : 'red'}`}
	>Current projection and paint survive unrelated styles.</Card
>
