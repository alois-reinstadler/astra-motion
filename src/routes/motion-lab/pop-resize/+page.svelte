<script lang="ts">
	import PopResizeDemo from '$lib/motion-lab/PopResizeDemo.svelte';
</script>

<svelte:head><title>Simultaneous resize and exit · Astra</title></svelte:head>

<main>
	<p class="eyebrow">POPLAYOUT / LIVE RUNTIME DEMO</p>
	<h1>A smaller card.<br />The same line breaks.</h1>
	<p class="intro">
		Resize a parent and remove its paragraph in the same update. Watch the text fade without
		rewrapping, then try reversing the transition halfway through.
	</p>
	<PopResizeDemo />
</main>

<style>
	main {
		max-width: 860px;
		margin: 0 auto;
		padding: 48px 24px 80px;
		color: #252821;
	}
	.eyebrow {
		font-size: 10px;
		letter-spacing: 0.12em;
		color: #bc3c21;
		margin: 0 0 20px;
	}
	h1 {
		font-size: clamp(32px, 5vw, 52px);
		font-weight: 500;
		line-height: 1.1;
		letter-spacing: -0.035em;
		margin: 0;
	}
	.intro {
		max-width: 58ch;
		color: #62695a;
		font-size: 16px;
		line-height: 1.7;
		margin: 24px 0 32px;
	}
</style>
