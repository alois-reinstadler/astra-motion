<script lang="ts">
	import { MotionConfig } from '$lib/motion/index.js';
	import { TextReveal, TextSwap } from '$lib/motion/text-entry.js';
	const message = 'Make room for a little motion.';
	const labels = ['Replay words', 'Play it again'];
	let replay = $state(0);
</script>

<div class="example">
	<MotionConfig reducedMotion="user">
		{#key replay}
			<TextReveal
				as="p"
				class="text-stage"
				text={message}
				split="words"
				effect="slide"
				stagger={0.055}
			/>
		{/key}
		<button onclick={() => replay++}>
			<TextSwap
				text={labels[replay % labels.length]}
				size="reserve"
				alternatives={labels}
				mode="wait"
				effect="fade"
			/>
		</button>
	</MotionConfig>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 20px;
		width: 100%;
		padding: 30px 24px;
		color: var(--site-ink, #252821);
	}
	.example :global(.text-stage) {
		max-width: 400px;
		min-height: 130px;
		margin: 0;
		display: block;
		font-size: 32px;
		line-height: 1.35;
		letter-spacing: -0.03em;
		text-align: center;
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		padding: 9px 18px;
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
</style>
