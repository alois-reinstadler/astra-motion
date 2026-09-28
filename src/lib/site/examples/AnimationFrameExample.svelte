<script lang="ts">
	import {
		motion,
		motionStore,
		useMotionValue,
		useAnimationFrame,
		useReducedMotion
	} from '$lib/motion/index.js';
	let running = $state(false);
	const x = useMotionValue(-60);
	const elapsed = useMotionValue(0);
	const time = motionStore(elapsed);
	const reduced = useReducedMotion();
	useAnimationFrame(
		(time, delta) => {
			elapsed.set(time);
			x.set(((x.get() + 60 + delta * 0.04) % 120) - 60);
		},
		() => ({ enabled: running && reduced.current === false })
	);
</script>

<div class="example">
	<button aria-pressed={running} onclick={() => (running = !running)}
		>{running ? 'Pause frames' : 'Start frames'}</button
	>
	<div class="stage"><motion.div class="marker" style={{ x }} /></div>
	<output>{Math.round($time)}ms elapsed</output>
	{#if reduced.current === true}<p>
			Frame motion is disabled by your reduced-motion preference.
		</p>{/if}
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 20px;
		width: 100%;
		padding: 28px 18px;
		color: var(--site-ink, #252821);
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 22px;
		padding: 8px 14px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.stage {
		display: grid;
		place-items: center;
		width: 230px;
		height: 80px;
	}
	.stage :global(.marker) {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #d34123;
	}
	output,
	p {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
	p {
		margin: 0;
	}
</style>
