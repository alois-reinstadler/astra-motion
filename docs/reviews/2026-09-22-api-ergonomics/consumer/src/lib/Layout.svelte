<script lang="ts">
	import { createLayout, Motion } from 'astra-motion';
	const group = createLayout();
	let selected = $state('Overview');
	let detail = $state(false);
</script>

<section>
	<h2>Shared layout</h2>
	<nav aria-label="Sections">
		{#each ['Overview', 'Details'] as label (label)}<button
				id={`tab-${label}`}
				aria-pressed={selected === label}
				onclick={() => (selected = label)}
				>{label}{#if selected === label}<span
						class="marker"
						data-marker
						{@attach group({ id: 'marker' })}
					></span>{/if}</button
			>{/each}
	</nav>
	<button id="detail" onclick={() => (detail = !detail)}>Toggle card detail</button>
	{#if detail}<article class="card large" data-card {@attach group({ id: 'card' })}>
			<div {@attach group({ mode: 'position' })}>Expanded card text</div>
			<div class="image" {@attach group({ mode: 'preserve-aspect' })}>
				<img src="/tile.svg" width="160" height="90" alt="Blue geometric sample" />
			</div>
		</article>
	{:else}<article class="card" data-card {@attach group({ id: 'card' })}>
			<div {@attach group({ mode: 'position' })}>Card text</div>
			<div class="image" {@attach group({ mode: 'preserve-aspect' })}>
				<img src="/tile.svg" width="160" height="90" alt="Blue geometric sample" />
			</div>
		</article>{/if}
	<Motion
		as="button"
		id="gesture"
		style="touch-action:pan-y"
		motion={{
			layout: true,
			animate: { x: detail ? 30 : 0 },
			whileHover: { scale: 1.05 },
			whileTap: { scale: 0.95 },
			drag: 'x',
			dragConstraints: { left: -40, right: 40 },
			dragMomentum: false
		}}>Drag or press</Motion
	>
</section>

<style>
	nav {
		display: flex;
		gap: 20px;
	}
	nav button {
		position: relative;
		padding: 12px;
	}
	.marker {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: coral;
	}
	.card {
		width: 180px;
		height: 140px;
		background: #ddd;
		padding: 12px;
	}
	.large {
		width: 360px;
		height: 220px;
	}
	.image {
		width: 160px;
		aspect-ratio: 16/9;
	}
	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
