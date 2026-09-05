<script lang="ts">
	import { createLayout } from 'astra-motion/layout';
	const layout = createLayout();
	let wide = $state(false);
</script>

<button onclick={() => (wide = !wide)}>Resize</button>
<article style:width={wide ? '100%' : '65%'} {@attach layout()}>
	<div {@attach layout({ mode: 'position' })}>
		<h2>Text keeps its proportions.</h2>
		<p>An existing content host compensates for the surface scaling.</p>
	</div>
</article>

<style>
	article {
		padding: 24px;
		background: #ecebe5;
		border-radius: 16px;
	}
</style>
