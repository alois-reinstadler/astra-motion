<script lang="ts">
	import { resolve } from '$app/paths';
	import UpdateMode from '$lib/motion-lab/UpdateMode.svelte';
	let automatic = $state(true);
</script>

<svelte:head><title>Astra / Automatic or explicit</title></svelte:head>

<main>
	<header>
		<a href={resolve('/motion-lab')}>astra® / back to the lab</a><span>CONTROL EXPERIMENT</span>
	</header>
	<p class="eyebrow">TWO WAYS TO REPORT A CHANGE</p>
	<h1>Who tells motion<br /><em>when to measure?</em></h1>
	<p class="lede">
		The same CSS movement. The same attachment. Switch observation off to see exactly what an
		explicit transaction adds.
	</p>
	<div class="modes" role="group" aria-label="Layout observation mode">
		<button class:active={automatic} aria-pressed={automatic} onclick={() => (automatic = true)}
			>Automatic · default</button
		>
		<button class:active={!automatic} aria-pressed={!automatic} onclick={() => (automatic = false)}
			>Explicit only</button
		>
	</div>
	<pre class="configuration"><code
			>{automatic
				? 'const layout = createLayout();'
				: 'const layout = createLayout({ automatic: false });'}</code
		></pre>
	{#key automatic}<UpdateMode {automatic} />{/key}
	<aside>
		<p>
			Only one mode is mounted here. Switching modes resets the example and removes the previous
			group.
		</p>
		<p>
			Groups share a document projection tree. If an automatic group is also mounted elsewhere, its
			observation can trigger measurements for other participants. <code>automatic: false</code> opts
			out of requesting observation; it is not an isolation boundary.
		</p>
		<p>
			Try alternating both buttons quickly. Reduced motion follows your system preference, so
			transform animation is immediate when that preference is enabled.
		</p>
	</aside>
</main>

<style>
	:global(body) {
		background: #f4f2eb;
	}
	main {
		max-width: 1040px;
		margin: 0 auto;
		padding: 32px 32px 80px;
		color: #353c2d;
		font-family: 'Instrument Sans Variable', sans-serif;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		padding-bottom: 32px;
		border-bottom: 1px solid #353c2d30;
	}
	header a {
		color: inherit;
		text-decoration: none;
	}
	header span,
	.eyebrow {
		font-size: 10px;
		letter-spacing: 0.12em;
	}
	.eyebrow {
		margin-top: 64px;
	}
	h1 {
		font:
			400 clamp(40px, 6vw, 76px)/1.03 Georgia,
			serif;
		letter-spacing: -0.045em;
		margin: 18px 0 24px;
	}
	h1 em {
		color: #ce5938;
		font-weight: 400;
	}
	.lede {
		max-width: 610px;
		line-height: 1.6;
		font-size: 17px;
	}
	.modes {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 36px;
	}
	button {
		border: 1px solid #353c2d;
		border-radius: 100px;
		padding: 12px 19px;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button.active {
		background: #353c2d;
		color: #f4f2eb;
	}
	button:focus-visible {
		outline: 3px solid #ce5938;
		outline-offset: 4px;
	}
	.configuration {
		overflow-x: auto;
		font-size: 13px;
		margin: 24px 0 28px;
	}
	aside {
		margin-top: 40px;
		padding-top: 20px;
		border-top: 1px solid #353c2d30;
		max-width: 690px;
		font-size: 13px;
		line-height: 1.65;
	}
	@media (max-width: 480px) {
		main {
			padding: 24px 20px 60px;
		}
		header span {
			display: none;
		}
	}
</style>
