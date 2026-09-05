<script lang="ts">
	import { resolve } from '$app/paths';
	import { createAnimate } from '$lib/motion/animate.js';
	import { stagger, type AnimationPlaybackControlsWithThen } from 'motion';
	let reduced = $state(false);
	let mounted = $state(true);
	let status = $state('Ready');
	let playback: AnimationPlaybackControlsWithThen | undefined;
	let revision = 0;
	const scope = createAnimate(() => ({ reducedMotion: reduced ? 'always' : 'user' }));
	const isolated = createAnimate();
	function play() {
		const current = ++revision;
		status = 'Playing';
		playback = scope.sequence([
			['.tile', { y: [0, -28], rotate: [0, -6] }, { duration: 0.55, delay: stagger(0.09) }],
			'return',
			['.tile', { y: 0, rotate: 0 }, { duration: 0.55, at: 'return', delay: stagger(0.06) }],
			['.light', { opacity: [0.2, 1, 0.2] }, { duration: 1.2, at: 0 }]
		]);
		void playback.then(() => {
			if (current === revision) status = 'Complete';
		});
	}
	function reset() {
		revision++;
		status = 'Retargeted';
		playback = scope.animate(
			'.tile',
			{ y: 0, rotate: 0 },
			{ type: 'spring', stiffness: 350, damping: 25 }
		);
	}
	function toggleMount() {
		revision++;
		mounted = !mounted;
		status = mounted ? 'Remounted' : 'Scope destroyed';
	}
</script>

<svelte:head><title>Scoped timelines · Astra motion lab</title></svelte:head>
<main>
	<a href={resolve('/motion-lab')}>← Motion lab</a>
	<p class="eyebrow">Motion engine / Svelte lifetime</p>
	<h1>One scope.<br />A whole sequence.</h1>
	<p class="intro">
		Replay while moving, pause halfway, retarget, or destroy the scene. The matching tiles below
		belong to a separate scope.
	</p>
	<div class="toolbar">
		<button onclick={play} disabled={!mounted}>Play sequence</button>
		<button
			onclick={() => {
				playback?.pause();
				status = 'Paused';
			}}
			disabled={!mounted}>Pause</button
		>
		<button
			onclick={() => {
				playback?.play();
				status = 'Playing';
			}}
			disabled={!mounted}>Resume</button
		>
		<button onclick={reset} disabled={!mounted}>Retarget to rest</button>
		<button onclick={toggleMount}>{mounted ? 'Destroy scope' : 'Remount scope'}</button>
		<label><input type="checkbox" bind:checked={reduced} /> Reduced motion</label>
	</div>
	<p class="status" role="status">{status}</p>
	{#if mounted}
		<section class="scene" aria-label="Timeline scene" {@attach scope.attach}>
			<span class="light"></span>
			{#each ['01', '02', '03', '04'] as label (label)}<div class="tile">{label}</div>{/each}
		</section>
	{:else}
		<div class="scene empty">Removed. Every owned animation stopped.</div>
	{/if}
	<section class="isolation" aria-label="Isolated scene" {@attach isolated.attach}>
		<div>
			<h2>Same selectors, another scope</h2>
			<p>These tiles should stay still when the sequence above plays.</p>
		</div>
		<div class="tile">A</div>
		<div class="tile">B</div>
		<button onclick={() => isolated.animate('.tile', { rotate: [0, 12, 0] }, { duration: 0.6 })}
			>Test isolation</button
		>
	</section>
	<pre><code
			>{`const scene = createAnimate();

scene.sequence([
  ['.tile', { y: -28 }, { duration: 0.5 }],
  'return',
  ['.tile', { y: 0 }, { at: 'return' }]
]);

<section {@attach scene.attach}>...</section>`}</code
		></pre>
</main>

<style>
	:global(body) {
		background: #f3f2ef;
		color: #202420;
	}
	main {
		max-width: 1100px;
		margin: auto;
		padding: 48px 28px 80px;
		font-family: system-ui, sans-serif;
	}
	a {
		color: inherit;
		font-size: 14px;
		text-decoration: none;
	}
	.eyebrow {
		margin-top: 52px;
		font-size: 12px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #637169;
	}
	h1 {
		font-size: clamp(42px, 7vw, 82px);
		font-weight: 500;
		line-height: 1.02;
		letter-spacing: -0.06em;
		margin: 18px 0 24px;
	}
	.intro {
		max-width: 590px;
		color: #687269;
		line-height: 1.6;
	}
	.toolbar {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
		margin-top: 28px;
	}
	button {
		border: 1px solid #cad0c9;
		background: #fff;
		padding: 10px 14px;
		border-radius: 6px;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}
	button:first-child {
		background: #243c32;
		color: white;
		border-color: #243c32;
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	label {
		font-size: 13px;
		margin-left: 8px;
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.status {
		font-size: 12px;
		color: #637169;
		min-height: 20px;
	}
	.scene {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		min-height: 300px;
		border-radius: 12px;
		background: #e0e8df;
		position: relative;
		overflow: hidden;
	}
	.tile {
		display: grid;
		place-items: center;
		width: 105px;
		height: 130px;
		border-radius: 12px;
		background: #fafaf7;
		border: 1px solid #bdcbbb;
		font-size: 27px;
		font-weight: 500;
		color: #446448;
		flex-shrink: 0;
	}
	.light {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 6px;
		background: #587754;
		opacity: 0.2;
	}
	.empty {
		color: #687269;
		font-size: 14px;
	}
	.isolation {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-top: 24px;
		border: 1px solid #d8ddd5;
		padding: 22px;
		border-radius: 12px;
	}
	.isolation > div:first-child {
		flex: 1;
	}
	.isolation .tile {
		width: 55px;
		height: 65px;
		font-size: 18px;
	}
	.isolation h2 {
		font-size: 17px;
		font-weight: 500;
	}
	.isolation p {
		font-size: 13px;
		color: #687269;
		max-width: 300px;
	}
	pre {
		background: #26392f;
		color: #d9e7d8;
		padding: 28px;
		border-radius: 12px;
		overflow: auto;
		margin-top: 28px;
		font-size: 13px;
		line-height: 1.7;
	}
	@media (max-width: 640px) {
		main {
			padding: 28px 18px;
		}
		.scene {
			gap: 10px;
			min-height: 230px;
		}
		.tile {
			width: 62px;
			height: 90px;
			font-size: 22px;
		}
		.isolation {
			flex-wrap: wrap;
		}
		.isolation > div:first-child {
			flex-basis: 100%;
		}
	}
</style>
