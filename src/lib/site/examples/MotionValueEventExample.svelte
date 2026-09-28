<script lang="ts">
	import { useAnimate, useMotionValue, useMotionValueEvent } from '$lib/motion/index.js';
	const value = useMotionValue(0);
	const [, animate] = useAnimate();
	let latest = $state(0);
	let events = $state<string[]>([]);
	const record = (event: string) => {
		events = [...events.slice(-3), event];
	};
	useMotionValueEvent(value, 'change', (next) => {
		latest = next;
	});
	useMotionValueEvent(value, 'animationStart', () => record('Started'));
	useMotionValueEvent(value, 'animationComplete', () => record('Completed'));
	useMotionValueEvent(value, 'animationCancel', () => record('Cancelled'));
	function start() {
		value.jump(0);
		animate(value, 100, { duration: 0.8, ease: 'linear' });
	}
</script>

<div class="example">
	<div class="controls">
		<button onclick={start}>Start value</button><button onclick={() => value.stop()}
			>Stop value</button
		>
	</div>
	<output>{Math.round(latest)} / 100</output>
	<p aria-live="polite">{events.join(' · ') || 'Waiting for an animation'}</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 22px;
		width: 100%;
		padding: 28px 18px;
		color: var(--site-ink, #252821);
	}
	.controls {
		display: flex;
		gap: 10px;
	}
	button {
		padding: 8px 14px;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
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
	output {
		font-size: 32px;
		font-variant-numeric: tabular-nums;
	}
	p {
		min-height: 20px;
		margin: 0;
		color: var(--site-muted, #67695e);
		font-size: 11px;
	}
</style>
