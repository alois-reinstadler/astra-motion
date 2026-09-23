<script lang="ts">
	import { untrack } from 'svelte';
	import { createAnimate } from '$lib/motion/index.js';

	const scene = createAnimate();
	let playback: ReturnType<typeof scene.sequence> | undefined;
	let status = $state<'playing' | 'paused' | 'ready'>('ready');
	let mounted = false;

	function replay() {
		status = 'playing';
		const run = scene.sequence(
			[
				['.disc', { x: [-72, 0], scale: [0.4, 1], opacity: [0, 1] }, { duration: 0.8 }],
				['.tile', { y: [60, 0], rotate: [-45, 0], opacity: [0, 1] }, { at: 0.35, duration: 0.8 }],
				['.stroke', { scaleX: [0, 1], opacity: [0, 1] }, { at: 0.8, duration: 0.65 }],
				['.caption', { y: [8, 0], opacity: [0, 1] }, { at: 1.15, duration: 0.5 }]
			],
			{ defaultTransition: { ease: [0.22, 1, 0.36, 1] } }
		);
		playback = run;
		void run.then(() => {
			if (mounted && playback === run) status = 'ready';
		});
	}

	function toggle() {
		if (status === 'playing') {
			playback?.pause();
			status = 'paused';
		} else if (status === 'paused') {
			playback?.play();
			status = 'playing';
		} else replay();
	}

	$effect(() =>
		untrack(() => {
			mounted = true;
			replay();
			return () => {
				mounted = false;
			};
		})
	);
</script>

<div class="example">
	<div class="composition" {@attach scene.attach}>
		<div class="art" aria-hidden="true">
			<div class="disc"></div>
			<div class="tile"></div>
			<div class="stroke"></div>
		</div>
		<p class="caption">Everything in its own time.</p>
	</div>
	<div class="controls">
		<button
			class="play"
			onclick={toggle}
			aria-label={status === 'playing' ? 'Pause sequence' : 'Play sequence'}
		>
			<span aria-hidden="true">{status === 'playing' ? 'Ⅱ' : '▷'}</span>
			{status === 'playing' ? 'Pause' : 'Play'}
		</button>
		<button class="replay" onclick={replay}>Replay <span aria-hidden="true">↺</span></button>
	</div>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 25px;
		width: 100%;
		padding: 24px 12px;
		color: #252821;
	}
	.composition {
		width: min(100%, 280px);
	}
	.art {
		position: relative;
		width: 200px;
		height: 175px;
		margin: 0 auto;
	}
	.disc {
		position: absolute;
		top: 17px;
		left: 16px;
		width: 112px;
		height: 112px;
		border-radius: 50%;
		background: #d34123;
	}
	.tile {
		position: absolute;
		top: 58px;
		left: 93px;
		width: 91px;
		height: 91px;
		border: 1px solid #b6bea6;
		background: #dfe5d1;
		border-radius: 3px;
	}
	.stroke {
		position: absolute;
		top: 137px;
		left: 27px;
		width: 113px;
		height: 14px;
		background: #252821;
		transform-origin: left center;
	}
	.caption {
		margin: 14px 0 0;
		text-align: center;
		color: #727568;
		font-size: 12px;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 18px;
	}
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	.play {
		min-width: 88px;
		height: 34px;
		border: 0;
		border-radius: 20px;
		color: #fffdf7;
		background: #252821;
	}
	.replay {
		border: 0;
		border-bottom: 1px solid #aeb1a4;
		padding: 0 0 5px;
		color: #252821;
		background: transparent;
	}
	.replay span {
		font-size: 18px;
		line-height: 1;
	}
</style>
