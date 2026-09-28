<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let visits = $state(0);
</script>

<div class="demo">
	<motion.button
		type="button"
		class="card"
		initial="rest"
		animate="rest"
		whileHover="hover"
		whileFocus="hover"
		variants={{ rest: { y: 0 }, hover: { y: -5 } }}
		onclick={() => visits++}
	>
		<motion.span class="disc" variants={{ rest: { rotate: -12 }, hover: { rotate: 12 } }} />
		<strong>A little breathing room</strong>
		<span>Read the collection</span>
	</motion.button>
	<p>Pointer hover and keyboard focus share one variant.</p>
	<output aria-live="polite">Opened {visits} {visits === 1 ? 'time' : 'times'}</output>
</div>

<style>
	.demo {
		display: grid;
		justify-items: center;
		gap: 15px;
		color: #252821;
	}
	.demo :global(.card) {
		display: grid;
		justify-items: start;
		gap: 12px;
		width: min(100%, 280px);
		padding: 25px;
		border: 1px solid #ddded3;
		border-radius: 10px;
		background: #fffdf7;
		color: inherit;
		text-align: left;
		font: inherit;
		cursor: pointer;
	}
	.demo :global(.card:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: 5px;
	}
	.demo :global(.disc) {
		width: 58px;
		height: 58px;
		margin-bottom: 6px;
		background: #dfe5d1;
		border: 1px solid #bfc8ae;
		border-radius: 18px 50% 50% 50%;
	}
	strong {
		font-size: 16px;
		font-weight: 500;
	}
	span,
	p,
	output {
		font-size: 11px;
	}
	p {
		margin: 0;
		color: #62695a;
		text-align: center;
	}
</style>
