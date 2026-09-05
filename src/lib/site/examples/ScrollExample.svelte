<script lang="ts">
	import { createScroll, motionStore } from '$lib/motion/index.js';

	const reading = createScroll();
	const progress = motionStore(reading.progress);
	const drift = reading.animate({ y: [0, -36], rotate: [-12, 12] });
</script>

<div class="example">
	<div class="reading-label">
		<span>FIELD NOTES / 01</span>
		<span>{Math.round($progress * 100)}% read</span>
	</div>
	<progress aria-label="Reading progress" max="1" value={$progress}></progress>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (This reading panel supports keyboard scrolling.) -->
	<section
		class="reader"
		tabindex="0"
		aria-label="Scroll to read the field notes"
		{@attach reading.container}
	>
		<div class="chapter opening">
			<p class="kicker">Scroll inside to explore ↓</p>
			<h3>A little<br />room to roam.</h3>
			<p>Good ideas rarely arrive in a straight line. Leave a little space for a detour.</p>
			<div class="sun" aria-hidden="true" {@attach drift}><span></span></div>
		</div>
		<div class="chapter middle">
			<p class="kicker">TAKE THE LONG WAY</p>
			<h3>Notice<br />the details.</h3>
			<p>The shape of a shadow. An unexpected colour. Something worth slowing down for.</p>
		</div>
		<div class="chapter closing">
			<p class="kicker">BRING SOMETHING BACK</p>
			<h3>A fresh<br />perspective.</h3>
			<p>Sometimes a small change of scenery is all it takes. Scroll back for another look.</p>
			<span class="end-mark" aria-hidden="true">✳</span>
		</div>
	</section>
</div>

<style>
	.example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.reading-label {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 0 2px 12px;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		font-variant-numeric: tabular-nums;
	}
	progress {
		display: block;
		appearance: none;
		width: 100%;
		height: 3px;
		border: 0;
		background: #deddd4;
		color: #d34123;
	}
	progress::-webkit-progress-bar {
		background: #deddd4;
	}
	progress::-webkit-progress-value {
		background: #d34123;
	}
	progress::-moz-progress-bar {
		background: #d34123;
	}
	.reader {
		position: relative;
		height: 265px;
		overflow: auto;
		overscroll-behavior: contain;
		border: 1px solid #deddd4;
		border-top: 0;
		background: #fbf9f2;
		scrollbar-color: #a8ad9e transparent;
		scrollbar-width: thin;
	}
	.reader:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	.chapter {
		position: relative;
		min-height: 280px;
		padding: 27px 28px 38px;
		overflow: hidden;
		box-sizing: border-box;
	}
	.kicker {
		position: relative;
		z-index: 1;
		margin: 0 0 21px;
		font-size: 10px;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	h3 {
		position: relative;
		z-index: 1;
		margin: 0 0 16px;
		font-size: clamp(30px, 5vw, 38px);
		font-weight: 500;
		line-height: 1.03;
		letter-spacing: -0.055em;
	}
	p:not(.kicker) {
		position: relative;
		z-index: 1;
		max-width: 235px;
		margin: 0;
		font-size: 12px;
		line-height: 1.65;
	}
	.sun {
		position: absolute;
		width: 118px;
		height: 118px;
		right: -35px;
		top: 55px;
		display: grid;
		place-items: center;
		border: 1px solid #d34123;
		border-radius: 50%;
		opacity: 0.4;
	}
	.sun::before,
	.sun span {
		content: '';
		display: block;
		position: absolute;
		width: 82px;
		height: 82px;
		border: 1px solid #d34123;
		border-radius: 50%;
	}
	.sun span {
		width: 45px;
		height: 45px;
		background: #d34123;
	}
	.middle {
		background: #dfe5d1;
	}
	.closing {
		background: #eee6dc;
	}
	.end-mark {
		display: block;
		margin-top: 24px;
		color: #d34123;
		font-size: 32px;
		line-height: 1;
	}
</style>
