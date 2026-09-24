<script lang="ts">
	import { motion, Presence } from '$lib/motion/index.js';

	const chapters = [
		{ title: 'Make room.', text: 'A little space can change everything.', color: '#dfe5d1' },
		{ title: 'Find a rhythm.', text: 'Good things happen between the beats.', color: '#edd1ba' },
		{ title: 'Keep moving.', text: 'The next idea is just around the corner.', color: '#e4dfce' }
	];
	let chapter = $state(0);
	let mode = $state<'wait' | 'sync'>('wait');
</script>

<div class="example">
	<div class="mode" role="group" aria-label="Transition mode">
		<button
			class:active={mode === 'wait'}
			aria-pressed={mode === 'wait'}
			onclick={() => (mode = 'wait')}>Wait</button
		>
		<button
			class:active={mode === 'sync'}
			aria-pressed={mode === 'sync'}
			onclick={() => (mode = 'sync')}>Sync</button
		>
	</div>
	<div class="stage" aria-live="polite">
		<Presence value={chapter} {mode}>
			{#snippet children(index)}
				<motion.article
					class="chapter"
					style={`background: ${chapters[index].color}`}
					motion={{
						initial: { opacity: 0, y: 24, rotate: 3 },
						animate: { opacity: 1, y: 0, rotate: 0 },
						exit: { opacity: 0, y: -24, rotate: -3 },
						transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
					}}
				>
					<span class="chapter-number">A NOTE TO SELF / 0{index + 1}</span>
					<h3>{chapters[index].title}</h3>
					<p>{chapters[index].text}</p>
					<span class="asterisk" aria-hidden="true">✳</span>
				</motion.article>
			{/snippet}
		</Presence>
	</div>
	<button class="next" onclick={() => (chapter = (chapter + 1) % chapters.length)}>
		Next note
	</button>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 20px;
		width: 100%;
		padding: 24px 12px;
		color: #252821;
	}
	button {
		font: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	.mode {
		display: flex;
		padding: 3px;
		border: 1px solid #d8d8cc;
		border-radius: 20px;
	}
	.mode button {
		border: 0;
		padding: 5px 16px;
		border-radius: 16px;
		background: transparent;
		color: #67695e;
		font-size: 12px;
	}
	.mode button.active {
		background: #252821;
		color: #fffdf7;
	}
	.stage {
		position: relative;
		width: min(100%, 260px);
		height: 200px;
	}
	.stage :global(.chapter) {
		position: absolute;
		inset: 0;
		padding: 23px;
		border-radius: 4px;
		overflow: hidden;
	}
	.chapter-number {
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.12em;
	}
	h3 {
		margin: 25px 0 8px;
		font-size: 27px;
		font-weight: 500;
		letter-spacing: -0.06em;
		line-height: 1.1;
	}
	p {
		max-width: 155px;
		margin: 0;
		font-size: 12px;
		line-height: 1.5;
	}
	.asterisk {
		position: absolute;
		right: 20px;
		bottom: 14px;
		color: #d34123;
		font-size: 44px;
		line-height: 1;
	}
	.next {
		display: flex;
		gap: 24px;
		align-items: center;
		border: 0;
		border-bottom: 1px solid #aeb1a4;
		padding: 0 0 6px;
		color: #252821;
		background: transparent;
		font-size: 12px;
	}
</style>
