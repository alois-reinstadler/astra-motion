<script lang="ts">
	import { resolve } from '$app/paths';
	import { createLayout } from '../motion/layout.js';
	const layout = createLayout({ transition: { duration: 0.8, ease: 'easeInOut' } });
	let moved = $state(false);
	let expanded = $state(false);
	let scrollport: HTMLDivElement | undefined;
	function crossBoundary() {
		if (!scrollport) return;
		scrollport.scrollTop = scrollport.scrollTop > 100 ? 35 : 180;
		moved = !moved;
	}
</script>

<svelte:head><title>Astra / Projection boundaries</title></svelte:head>
<main>
	<a href={resolve('/motion-lab')}>Back to motion laboratory</a>
	<h1>Transforms and sticky boundaries</h1>
	<p>Change layout, reverse it mid-flight, and scroll through the sticky threshold.</p>
	<div class="controls">
		<button onclick={() => (moved = !moved)}>Move and resize</button>
		<button onclick={() => (expanded = !expanded)}>Resize registered parent</button>
		<button onclick={crossBoundary}>Cross sticky boundary</button>
	</div>
	<section class="transformed-stage" class:expanded {@attach layout()}>
		<h2>Nested affine wrappers</h2>
		<div class="outer-transform">
			<div class="inner-transform">
				<div class="tile" class:moved data-testid="affine-tile" {@attach layout()}>Affine</div>
			</div>
		</div>
	</section>
	<section>
		<h2>Nested scrolling and clipping</h2>
		<div class="outer-scroll">
			<div
				class="scrollport"
				{@attach (node) => {
					scrollport = node;
					return () => {
						scrollport = undefined;
					};
				}}
				data-testid="boundary-scrollport"
			>
				<div class="spacer">Scroll down to pin the card</div>
				<div class="sticky">
					<div class="tile" class:moved data-testid="sticky-tile" {@attach layout()}>Sticky</div>
				</div>
				<div class="tail">The browser owns pinning and scrolling.</div>
			</div>
			<div class="outer-tail"></div>
		</div>
	</section>
</main>

<style>
	main {
		max-width: 960px;
		margin: 0 auto;
		padding: 3rem 2rem;
		font-family: system-ui, sans-serif;
		color: #203047;
	}
	main :global(button) {
		padding: 0.65rem 1rem;
		border: 1px solid #6383ad;
		border-radius: 0.5rem;
		background: #192b43;
		color: white;
		cursor: pointer;
	}
	a {
		color: #235f99;
	}
	h1 {
		font-size: clamp(2rem, 5vw, 3.4rem);
		line-height: 1.1;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 2rem 0;
	}
	section {
		margin: 2rem 0;
		border: 1px solid #50647e;
		border-radius: 1rem;
		padding: 1.5rem;
		background: #111f31;
		color: #e9eef8;
	}
	.transformed-stage {
		width: 78%;
		height: 340px;
	}
	.transformed-stage.expanded {
		width: 100%;
	}
	.outer-transform {
		margin: 45px;
		width: 280px;
		transform: rotate(15deg) scale(1.05, 0.85);
		transform-origin: 23px 71px;
	}
	.inner-transform {
		width: 300px;
		height: 150px;
		translate: 8px 12px;
		rotate: -24deg;
		scale: 0.9 1.2;
		transform: skewX(10deg);
		transform-origin: 17px 23px;
	}
	.tile {
		position: relative;
		left: 0;
		top: 0;
		width: 90px;
		height: 60px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		background: #c3ff7a;
		color: #183000;
		font-weight: 700;
	}
	.tile.moved {
		left: 150px;
		top: 30px;
		width: 120px;
		height: 80px;
	}
	.outer-scroll {
		height: 320px;
		overflow: auto;
		overflow-anchor: none;
		border: 1px dashed #6383ad;
	}
	.scrollport {
		height: 270px;
		margin: 50px 15px 0;
		overflow: auto;
		overflow-anchor: none;
		border: 1px solid #7b97ba;
	}
	.spacer {
		height: 110px;
		padding: 1rem;
	}
	.sticky {
		position: sticky;
		top: 12px;
		height: 130px;
		padding: 10px;
		overflow: clip;
		background: #294865;
	}
	.tail {
		height: 600px;
		padding: 1rem;
	}
	.outer-tail {
		height: 100px;
	}
</style>
