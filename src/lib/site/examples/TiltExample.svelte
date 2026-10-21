<script lang="ts">
	import { MotionConfig } from '$lib/motion/index.js';
	import { Tilt } from '$lib/motion/tilt-entry.js';
	let enabled = $state(true);
</script>

<div class="example">
	<MotionConfig reducedMotion="user">
		<Tilt disabled={!enabled} maxRotateX={8} maxRotateY={8}>
			<article>
				<p>POINTER TILT</p>
				<h3>A little perspective.</h3>
				<p>
					The movement is decorative. All content remains available to keyboard and touch users.
				</p>
			</article>
		</Tilt>
	</MotionConfig>
	<label><input type="checkbox" bind:checked={enabled} /> Enable decorative tilt</label>
</div>

<style>
	.example {
		display: grid;
		gap: 20px;
		justify-items: center;
		padding: 32px;
	}
	article {
		max-width: 320px;
		padding: 28px;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 18px;
		background: var(--site-paper, #f7f7f0);
	}
	h3 {
		font-size: 26px;
		margin: 12px 0;
	}
	p {
		line-height: 1.5;
	}
	label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
	}
	input:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 3px;
	}
</style>
