<script lang="ts">
	import { createScroll } from 'astra-motion/scroll';
	const reading = createScroll();
	const fill = reading.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
</script>

<div class="scroller" {@attach reading.container}>
	<div class="meter" {@attach fill}></div>
	<p>Scroll through this reading surface.</p>
</div>

<style>
	.scroller {
		position: relative;
		height: 220px;
		overflow: auto;
	}
	.meter {
		position: sticky;
		top: 0;
		height: 4px;
		background: coral;
		transform-origin: left;
	}
	p {
		min-height: 700px;
		padding: 24px;
	}
</style>
