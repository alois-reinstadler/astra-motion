<script lang="ts">
	import { useAnimate, stagger } from '$lib/motion/index.js';
	const [scope, animate] = useAnimate({ reducedMotion: 'user' });
	let playback = $state.raw<ReturnType<typeof animate>>();
	let status = $state('Ready');
	function replay() {
		playback?.stop();
		status = 'Playing';
		const current = animate(
			[
				['.tile', { opacity: [0.35, 1], y: [16, 0] }, { delay: stagger(0.08) }],
				['.tile', { backgroundColor: ['#dfe5d1', '#edd1ba'] }, { at: '<' }]
			],
			{ defaultTransition: { duration: 0.45 } }
		);
		playback = current;
		void current.finished.then(() => {
			if (playback === current) status = 'Finished';
		});
	}
</script>

<div class="example">
	<div class="controls">
		<button onclick={replay}>Replay sequence</button><button
			onclick={() => {
				playback?.pause();
				status = 'Paused';
			}}>Pause</button
		><button
			onclick={() => {
				playback?.play();
				status = 'Playing';
			}}>Resume</button
		><button onclick={() => playback?.complete()}>Finish</button>
	</div>
	<div class="tiles" {@attach scope.attach}>
		{#each ['A', 'S', 'T'] as letter (letter)}<div class="tile">{letter}</div>{/each}
	</div>
	<p aria-live="polite">{status} · {scope.active} active run(s)</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
		width: 100%;
		padding: 28px 18px;
		color: var(--site-ink, #252821);
	}
	.controls {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px;
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 22px;
		padding: 8px 12px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.tiles {
		display: flex;
		gap: 10px;
		padding: 20px 0;
	}
	.tile {
		display: grid;
		place-items: center;
		width: 64px;
		height: 72px;
		border-radius: 4px;
		background: #dfe5d1;
		font-size: 32px;
	}
	p {
		margin: 0;
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
