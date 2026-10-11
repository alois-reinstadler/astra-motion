<script lang="ts">
	import {
		motion,
		motionStore,
		useSpring,
		useTransform,
		useVelocity,
		useReducedMotion
	} from '$lib/motion/index.js';
	const x = useSpring(0, { stiffness: 140, damping: 16 });
	const velocity = useVelocity(x);
	const scale = useTransform(() => 1 + Math.min(Math.abs(velocity.get()) / 500, 1) * 0.65);
	const skew = useTransform(velocity, [-500, 0, 500], [-25, 0, 25]);
	const speed = motionStore(velocity);
	const reduced = useReducedMotion();
	let right = false;
	function move() {
		right = !right;
		const next = right ? 80 : -80;
		if (reduced.current !== false) x.jump(next);
		else x.set(next);
	}
</script>

<div class="example">
	<button onclick={move}>Move the marker</button>
	<div class="stage">
		<motion.div class="marker" style={{ x, scale, skewX: skew }}
			><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"
				><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" /></svg
			></motion.div
		>
	</div>
	<output>{Math.round($speed)} pixels per second</output>
	<p>
		Speed changes the marker’s size. Left and right movement both grow it; rest returns it to
		normal.
	</p>
</div>

<style>
	p {
		max-width: 300px;
		margin: 0;
		font-size: 12px;
		line-height: 1.6;
		text-align: center;
		color: var(--site-muted);
	}
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
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
		width: 260px;
		height: 95px;
	}
	.stage :global(.marker) {
		width: 48px;
		height: 48px;
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: #fffdf7;
		background: #d34123;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
		font-variant-numeric: tabular-nums;
	}
</style>
