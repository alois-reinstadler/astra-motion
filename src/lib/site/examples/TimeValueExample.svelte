<script lang="ts">
	import {
		motion,
		motionStore,
		useMotionValue,
		useTime,
		useTransform,
		useReducedMotion
	} from '$lib/motion/index.js';
	const time = useTime();
	const start = useMotionValue(0);
	const reduced = useReducedMotion();
	let rotating = $state(false);
	const rotate = useTransform(() =>
		rotating && reduced.current === false ? (time.get() - start.get()) / 15 : 0
	);
	const seconds = motionStore(useTransform(() => Math.floor((time.get() - start.get()) / 1000)));
</script>

<div class="example">
	<motion.div class="dial" style={{ rotate }} aria-hidden="true"><span></span></motion.div>
	<output>{$seconds} seconds</output>
	<button aria-pressed={rotating} onclick={() => (rotating = !rotating)}
		>{rotating ? 'Stop rotation' : 'Start rotation'}</button
	>
	<button onclick={() => start.set(time.get())}>Restart clock</button>
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
	.example :global(.dial) {
		display: grid;
		justify-items: center;
		width: 90px;
		height: 90px;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 50%;
		background: #dfe5d1;
	}
	span {
		width: 3px;
		height: 36px;
		margin-top: 9px;
		background: #d34123;
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
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
