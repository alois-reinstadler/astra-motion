<script lang="ts">
	import { MotionConfig, motion, AnimateActivity } from '$lib/motion/index.js';
	import { TextReveal, TextSwap } from '$lib/motion/text-entry.js';
	import { Tilt } from '$lib/motion/tilt-entry.js';
	import type { TextEffect, TextSplit } from '$lib/motion/text-entry.js';
	import type { ReducedMotion } from '$lib/motion/policy.js';
	let effect = $state<TextEffect>('blur');
	let split = $state<TextSplit>('words');
	let policy = $state<ReducedMotion>('user');
	let mode = $state<'sync' | 'wait'>('wait');
	let active = $state(true);
	let visible = $state(true);
	let tiltDisabled = $state(false);
	let selection = $state(0);
	let wide = $state(false);
	const messages = [
		'Make room for a little motion.',
		'Keep your place while the words change. A longer message can wrap naturally.',
		'Hello, 世界. 👨‍👩‍👧‍👦 é!'
	];
</script>

<svelte:head><title>Text and Tilt / Astra Motion</title></svelte:head>
<main>
	<header>
		<p>ASTRA / COMPOSITION LAB</p>
		<h1>Words that move.<br />Content that stays.</h1>
		<p>Plain text and pointer tilt, with native controls and explicit motion policy.</p>
	</header>
	<div class="controls">
		<label
			>Effect<select bind:value={effect}
				><option>fade</option><option>slide</option><option>blur</option></select
			></label
		>
		<label
			>Segments<select bind:value={split}
				><option>whole</option><option>words</option><option>graphemes</option></select
			></label
		>
		<label
			>Policy<select bind:value={policy}
				><option value="user">Device preference</option><option value="always"
					>Reduced motion</option
				><option value="never">Full motion</option></select
			></label
		>
		<label
			>Swap<select bind:value={mode}
				><option value="wait">Exit before enter</option><option value="sync">Overlap</option
				></select
			></label
		>
		<button
			onclick={() => {
				active = !active;
			}}>{active ? 'Hide activity' : 'Show activity'}</button
		>
	</div>
	<MotionConfig reducedMotion={policy}>
		<AnimateActivity mode={active ? 'visible' : 'hidden'}>
			<div class="stages">
				<section>
					<p class="eyebrow">01 / REVEAL</p>
					<TextReveal
						as="h2"
						text="Make room for a little motion."
						{effect}
						{split}
						stagger={0.035}
						trigger="state"
						{visible}
					/>
					<button
						onclick={() => {
							visible = !visible;
						}}>{visible ? 'Hide words' : 'Reveal words'}</button
					>
				</section>
				<section>
					<p class="eyebrow">02 / REPLACEMENT</p>
					<TextSwap
						as="p"
						class="swap-copy"
						text={messages[selection]}
						alternatives={messages}
						size="reserve"
						{mode}
						{effect}
						{split}
						stagger={0.02}
					/>
					<button
						onclick={() => {
							selection = (selection + 1) % messages.length;
						}}>Next message</button
					>
					<p class="hint">The largest alternative reserves space at this width and font.</p>
				</section>
				<section class="tilt-section">
					<p class="eyebrow">03 / TILT + OUTER LAYOUT</p>
					<motion.div
						layout
						style={{ width: wide ? '100%' : '85%', margin: 'auto' }}
						initial={{ opacity: 0.5, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Tilt disabled={tiltDisabled} maxRotateX={8} maxRotateY={10}>
							<article class="card">
								<p>Perspective / 800</p>
								<h2>Stay in touch.</h2>
								<label>Your note<input placeholder="Focus stays here" /></label><button
									onclick={() => {
										wide = !wide;
									}}>Change outer layout</button
								>
							</article>
						</Tilt>
					</motion.div>
					<button
						onclick={() => {
							tiltDisabled = !tiltDisabled;
						}}>{tiltDisabled ? 'Enable tilt' : 'Disable tilt'}</button
					>
					<p class="hint">Touch stays neutral. Try a pointer, then leave the card.</p>
				</section>
			</div>
		</AnimateActivity>
	</MotionConfig>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f4f1e9;
		color: #292d26;
		font-family: Arial, sans-serif;
	}
	main {
		max-width: 1120px;
		margin: 0 auto;
		padding: 64px 24px;
	}
	header {
		max-width: 720px;
		margin-bottom: 40px;
	}
	header > p:first-child,
	.eyebrow {
		font-size: 11px;
		letter-spacing: 0.12em;
	}
	h1 {
		font-size: clamp(36px, 6vw, 72px);
		letter-spacing: -0.055em;
		line-height: 1.03;
		margin: 22px 0;
	}
	header > p:last-child {
		color: #61665c;
		line-height: 1.5;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: end;
		padding: 20px 0 32px;
		border-bottom: 1px solid #c6cabb;
	}
	label {
		display: grid;
		gap: 8px;
		font-size: 12px;
	}
	select,
	button,
	input {
		font: inherit;
		color: inherit;
		border: 1px solid #a8b09d;
		border-radius: 6px;
		background: transparent;
		padding: 10px 13px;
	}
	button {
		cursor: pointer;
	}
	button:focus-visible,
	select:focus-visible,
	input:focus-visible {
		outline: 2px solid #ba4a27;
		outline-offset: 3px;
	}
	.stages {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 32px;
		padding-top: 32px;
	}
	section {
		min-width: 0;
	}
	section :global(h2) {
		font-size: clamp(28px, 4vw, 42px);
		letter-spacing: -0.04em;
		line-height: 1.15;
	}
	section :global(.swap-copy) {
		font-size: 24px;
		line-height: 1.4;
	}
	.hint {
		color: #61665c;
		font-size: 12px;
		line-height: 1.5;
	}
	.tilt-section {
		grid-column: 1/-1;
		max-width: 600px;
		width: 100%;
		margin: 20px auto 0;
	}
	.card {
		box-sizing: border-box;
		padding: 32px;
		background: #d9e5ce;
		border: 1px solid #9ea995;
		border-radius: 14px;
		display: grid;
		gap: 18px;
		margin: 24px 0;
		box-shadow: 0 12px 24px #22332210;
	}
	.card h2,
	.card p {
		margin: 0;
	}
	.card p {
		font-size: 12px;
	}
	input {
		width: 100%;
		box-sizing: border-box;
	}
	@media (max-width: 600px) {
		main {
			padding: 32px 20px;
		}
		.stages {
			grid-template-columns: 1fr;
		}
		.card {
			padding: 22px;
		}
	}
</style>
