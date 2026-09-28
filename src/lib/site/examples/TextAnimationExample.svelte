<script lang="ts">
	import { MotionConfig, motion, stagger } from '$lib/motion/index.js';
	const message = 'Make room for a little motion.';
	const words = message.split(/(\s+)/);
	let replay = $state(0);
</script>

<div class="example">
	<MotionConfig reducedMotion="user">
		{#key replay}
			<motion.p
				class="text-stage"
				initial="hidden"
				animate="visible"
				variants={{ hidden: {}, visible: { transition: { delayChildren: stagger(0.055) } } }}
			>
				<span class="sr-only">{message}</span><span aria-hidden="true"
					>{#each words as word, index (index)}{#if word.trim()}<motion.span
								class="word"
								variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
								transition={{ duration: 0.3 }}>{word}</motion.span
							>{:else}{word}{/if}{/each}</span
				>
			</motion.p>
		{/key}
	</MotionConfig>
	<button onclick={() => replay++}>Replay words</button>
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
	.example :global(.word) {
		display: inline-block;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
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
