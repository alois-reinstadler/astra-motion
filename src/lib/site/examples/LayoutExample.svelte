<script lang="ts">
	import { motion, createLayout } from '$lib/motion/index.js';
	let expanded = $state(false);
	const layout = createLayout({ transition: { type: 'spring', stiffness: 300, damping: 30 } });
</script>

<div class="layout-example">
	<div class="stage">
		<motion.div class="record" layout layoutGroup={layout}>
			<div class="record-heading" {@attach layout({ mode: 'position' })}>
				<div class="artwork" aria-hidden="true"><span></span></div>
				<div>
					<span class="eyebrow">ON REPEAT</span>
					<h3>Slow mornings</h3>
					<p>A little room to breathe.</p>
				</div>
				<span class="play" aria-hidden="true">Ⅱ</span>
			</div>
			{#if expanded}
				<div class="details" {@attach layout({ mode: 'position' })}>
					<div class="progress"><span></span></div>
					<div class="times"><span>1:24</span><span>3:42</span></div>
					<p>Soft keys. Open windows. Nowhere to rush.</p>
				</div>
			{/if}
		</motion.div>
	</div>
	<button type="button" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
		{expanded ? 'Close player' : 'Open player'}
		<span aria-hidden="true">{expanded ? '−' : '+'}</span>
	</button>
</div>

<style>
	.layout-example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.stage {
		min-height: 228px;
		display: grid;
		align-content: center;
	}
	.layout-example :global(.record) {
		padding: 18px;
		overflow: hidden;
		isolation: isolate;
		border: 1px solid #dbd9cf;
		border-radius: 16px;
		background: #fffdf7;
		box-shadow: 0 12px 32px #25282108;
	}
	.record-heading {
		display: flex;
		align-items: center;
		gap: 13px;
	}
	.artwork {
		position: relative;
		display: grid;
		place-items: center;
		width: 54px;
		height: 62px;
		flex: none;
		overflow: hidden;
		border-radius: 5px;
		background: #dfe5d1;
	}
	.artwork::before {
		content: '';
		position: absolute;
		width: 54px;
		height: 54px;
		left: -17px;
		top: 20px;
		border: 12px solid #80916b;
		border-radius: 50%;
	}
	.artwork > span {
		z-index: 1;
		width: 29px;
		height: 29px;
		margin-left: 16px;
		margin-top: -10px;
		border-radius: 50%;
		background: #d34123;
	}
	.eyebrow {
		color: #62695a;
		font-size: 9px;
		letter-spacing: 0.13em;
	}
	h3 {
		margin: 3px 0;
		font-size: 17px;
		font-weight: 550;
		letter-spacing: -0.04em;
	}
	p {
		margin: 0;
		color: #62695a;
		font-size: 11px;
		line-height: 1.5;
	}
	.play {
		margin-left: auto;
		color: #d34123;
		font-size: 19px;
		font-weight: 600;
	}
	.details {
		padding-top: 25px;
		animation: details-enter 240ms ease-out 100ms both;
	}
	@keyframes details-enter {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.details {
			animation: none;
		}
	}
	.progress {
		height: 3px;
		border-radius: 3px;
		background: #e8e8df;
	}
	.progress > span {
		display: block;
		width: 38%;
		height: 100%;
		border-radius: inherit;
		background: #d34123;
	}
	.times {
		display: flex;
		justify-content: space-between;
		padding-top: 7px;
		color: #62695a;
		font-size: 9px;
		font-variant-numeric: tabular-nums;
	}
	.details > p {
		padding-top: 15px;
	}
	button {
		width: 100%;
		padding: 13px 17px;
		display: flex;
		justify-content: space-between;
		align-items: center;
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
