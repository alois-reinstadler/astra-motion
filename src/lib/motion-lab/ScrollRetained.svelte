<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createScroll } from '../motion/scroll.svelte.js';
	const progress = createScroll();
	const fill = progress.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
</script>

<div transition:fade={{ duration: 800 }}>
	<div
		data-testid="retained-scroll-container"
		style="height: 100px; overflow: auto; position: relative"
		{@attach progress.container}
	>
		<div
			data-testid="retained-scroll-fill"
			style="height: 10px; background: coral; transform-origin: left"
			{@attach fill}
		></div>
		<div style="height: 400px"></div>
	</div>
</div>
