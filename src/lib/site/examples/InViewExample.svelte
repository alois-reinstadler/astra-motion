<script lang="ts">
	import { createInView, createMotion } from '$lib/motion/index.js';

	let panel = $state<HTMLElement>();
	let target = $state<HTMLElement>();
	const visible = createInView(
		() => target,
		() => ({ root: panel, amount: 0.6 })
	);
	const card = createMotion(() => ({
		initial: false,
		animate: { opacity: visible.current ? 1 : 0, y: visible.current ? 0 : 24 },
		transition: { type: 'spring', stiffness: 220, damping: 25 }
	}));
</script>

<div class="example">
	<div class="heading">
		<span>A MOMENT OF DISCOVERY</span>
		<span class="status" class:visible={visible.current} role="status"
			><i></i>{visible.current ? 'In view' : 'Out of view'}</span
		>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (This panel supports keyboard scrolling.) -->
	<section
		class="viewport"
		{@attach (node) => {
			panel = node;
			return () => {
				panel = undefined;
			};
		}}
		tabindex="0"
		aria-label="Scroll to reveal a discovery card"
	>
		<div class="invitation">
			<span class="number">01 — 02</span>
			<h3>Good things<br />come into view.</h3>
			<p>Scroll inside to find yours <span aria-hidden="true">↓</span></p>
		</div>
		<div
			class="target"
			{@attach (node) => {
				target = node;
				return () => {
					target = undefined;
				};
			}}
		>
			<div class="card" {...card.props}>
				<span class="symbol" aria-hidden="true">✳</span>
				<div>
					<span class="eyebrow">THERE IT IS</span>
					<h4>A new perspective.</h4>
					<p>A small reveal. A little delight.</p>
				</div>
			</div>
		</div>
		<p class="return">Scroll back up to try again ↑</p>
	</section>
</div>

<style>
	.example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		padding: 0 2px 13px;
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.07em;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 5px;
		letter-spacing: 0;
		font-weight: 400;
		font-size: 11px;
	}
	.status i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #aaa99f;
	}
	.status.visible i {
		background: #536c40;
	}
	.viewport {
		position: relative;
		height: 265px;
		overflow: auto;
		overscroll-behavior: contain;
		border: 1px solid #deddd4;
		background: #fbf9f2;
		scrollbar-color: #a8ad9e transparent;
		scrollbar-width: thin;
	}
	.viewport:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	.invitation {
		height: 270px;
		box-sizing: border-box;
		padding: 27px 25px;
	}
	.number {
		font-size: 10px;
		letter-spacing: 0.1em;
		color: #555e4b;
	}
	h3 {
		margin: 27px 0 19px;
		font-weight: 500;
		font-size: clamp(29px, 5vw, 36px);
		line-height: 1.05;
		letter-spacing: -0.055em;
	}
	.invitation p {
		margin: 0;
		font-size: 12px;
		color: #66695f;
	}
	.invitation p span {
		margin-left: 6px;
		color: #d34123;
	}
	.target {
		margin: 0 18px;
	}
	.card {
		display: flex;
		align-items: center;
		gap: 16px;
		min-height: 120px;
		padding: 21px 18px;
		box-sizing: border-box;
		border-radius: 3px;
		background: #dfe5d1;
	}
	.symbol {
		font-size: 45px;
		line-height: 1;
		color: #d34123;
	}
	.eyebrow {
		font-size: 9px;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	h4 {
		margin: 9px 0 7px;
		font-size: 20px;
		line-height: 1.12;
		font-weight: 500;
		letter-spacing: -0.04em;
	}
	.card p {
		margin: 0;
		font-size: 11px;
		line-height: 1.5;
	}
	.return {
		margin: 0;
		padding: 29px 18px 36px;
		text-align: center;
		font-size: 11px;
		color: #66695f;
	}
</style>
