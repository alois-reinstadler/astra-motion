<script lang="ts">
	import { createAnimate } from 'astra-motion/animate';
	const scene = createAnimate();
	function play() {
		scene.sequence([
			['.tile', { y: -24, opacity: 0.5 }, { duration: 0.2 }],
			'return',
			['.tile', { y: 0, opacity: 1 }, { at: 'return', duration: 0.3 }]
		]);
	}
</script>

<button onclick={play}>Play / replace</button>
<section {@attach scene.attach}>
	<div class="tile">Only this tile moves.</div>
</section>

<style>
	section {
		padding: 40px;
	}
	.tile {
		padding: 20px;
		background: #ecebe5;
	}
</style>
