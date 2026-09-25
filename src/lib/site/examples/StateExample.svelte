<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let visible = $state(true);
</script>

<div class="state-example">
	<div class="stage" aria-live="polite">
		<div class="placeholder" aria-hidden="true">A little good news.</div>
		{#if visible}
			<motion.div
				class="notification"
				initial={{ opacity: 0, y: 28, scale: 0.92 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: -20, scale: 0.96 }}
				transition={{ type: 'spring', stiffness: 320, damping: 24 }}
			>
				<span class="check" aria-hidden="true">✓</span>
				<div>
					<span class="eyebrow">ALL SET</span>
					<h3>Your work is saved.</h3>
					<p>Go make something wonderful.</p>
				</div>
			</motion.div>
		{/if}
	</div>
	<button type="button" onclick={() => (visible = !visible)} aria-pressed={visible}>
		{visible ? 'Dismiss notification' : 'Show notification'}
		<span aria-hidden="true">{visible ? '−' : '+'}</span>
	</button>
</div>

<style>
	.state-example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.stage {
		min-height: 216px;
		position: relative;
		display: grid;
		place-items: center;
	}
	.placeholder {
		display: grid;
		justify-items: center;
		gap: 12px;
		color: #777b70;
		font-size: 13px;
	}

	.state-example :global(.notification) {
		position: absolute;
		inset: auto 0;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 23px 20px;
		border: 1px solid #d4d9c9;
		border-radius: 16px;
		background: #edf0e4;
		box-shadow: 0 12px 32px #2528210d;
	}
	.check {
		width: 42px;
		height: 42px;
		flex: none;
		display: grid;
		place-items: center;
		border-radius: 50%;
		color: #fffdf7;
		background: #536a3b;
		font-size: 23px;
	}
	.eyebrow {
		color: #59644c;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.15em;
	}
	h3 {
		margin: 4px 0;
		font-size: 17px;
		font-weight: 550;
		letter-spacing: -0.035em;
	}
	p {
		margin: 0;
		color: #59644c;
		font-size: 12px;
		line-height: 1.5;
	}
	button {
		width: 100%;
		padding: 13px 17px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid #d5d5ca;
		border-radius: 8px;
		background: #fffdf7;
		color: #252821;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:hover {
		border-color: #858c79;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	button > span {
		font-size: 19px;
		line-height: 1;
	}
</style>
