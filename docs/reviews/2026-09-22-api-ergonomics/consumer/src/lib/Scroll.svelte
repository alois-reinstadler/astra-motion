<script lang="ts">
	import { createScroll } from 'astra-motion';
	let reduce = $state(false);
	const scroll = createScroll(() => ({ reducedMotion: reduce ? 'always' : 'never' }));
	const linked = scroll.animate({ x: [0, 100] });
</script>

<section>
	<h2>Scroll</h2>
	<button id="scroll-reduce" onclick={() => (reduce = !reduce)}>Toggle scroll reduced motion</button
	>
	<div
		id="scroller"
		style="height:120px;overflow:auto;position:relative"
		{@attach scroll.container}
	>
		<div id="linked" {@attach linked}>Linked</div>
		<div style="height:500px">Scrollable content</div>
	</div>
</section>
