<script lang="ts">
	import { createMotion } from '$lib/motion/index.js';

	let open = $state(true);
	const menu = createMotion(() => ({
		initial: 'closed',
		animate: open ? 'open' : 'closed',
		variants: { open: { opacity: 1 }, closed: { opacity: 1 } },
		transition: { staggerChildren: 0.12 }
	}));
	const item = {
		variants: { open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: -18 } },
		transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
	};
	const first = menu.child(item);
	const second = menu.child(item);
	const third = menu.child(item);
</script>

<div class="example">
	<div class="menu">
		<div class="heading">
			<span class="eyebrow">YOUR WORKSPACE</span>
			<button
				onclick={() => (open = !open)}
				aria-expanded={open}
				aria-label={open ? 'Close workspace menu' : 'Open workspace menu'}
			>
				<span aria-hidden="true">{open ? '−' : '+'}</span>
			</button>
		</div>
		<div class="items" {...menu.props} inert={!open}>
			<div class="item" {...first.props}>
				<span class="icon projects" aria-hidden="true">▦</span>
				<div><strong>Projects</strong><span>Give your ideas a home</span></div>
				<span class="arrow" aria-hidden="true">↗</span>
			</div>
			<div class="item" {...second.props}>
				<span class="icon notes" aria-hidden="true">≋</span>
				<div><strong>Notes</strong><span>Catch a passing thought</span></div>
				<span class="arrow" aria-hidden="true">↗</span>
			</div>
			<div class="item" {...third.props}>
				<span class="icon collection" aria-hidden="true">✳</span>
				<div><strong>Collection</strong><span>A few things worth keeping</span></div>
				<span class="arrow" aria-hidden="true">↗</span>
			</div>
		</div>
	</div>
	<button class="toggle" onclick={() => (open = !open)}
		>{open ? 'Hide menu' : 'Reveal menu'} <span aria-hidden="true">↗</span></button
	>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
		width: 100%;
		padding: 30px 12px;
		color: #252821;
	}
	.menu {
		width: min(100%, 300px);
	}
	.heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 0 12px;
		border-bottom: 1px solid #d8d8cc;
	}
	.eyebrow {
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.14em;
	}
	button {
		font: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	.heading button {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 1px solid #d8d8cc;
		border-radius: 50%;
		color: #252821;
		background: transparent;
		font-size: 21px;
		line-height: 1;
	}
	.items {
		display: grid;
		gap: 6px;
		padding-top: 10px;
	}
	.item {
		display: flex;
		gap: 11px;
		align-items: center;
		min-height: 56px;
	}
	.icon {
		display: grid;
		place-items: center;
		flex: 0 0 35px;
		height: 39px;
		border-radius: 3px;
		font-size: 25px;
	}
	.projects {
		background: #dfe5d1;
	}
	.notes {
		background: #edd1ba;
	}
	.collection {
		color: #fffdf7;
		background: #d34123;
	}
	.item div {
		display: grid;
		gap: 4px;
	}
	strong {
		font-size: 13px;
		font-weight: 500;
	}
	.item div span {
		color: #727568;
		font-size: 10px;
	}
	.arrow {
		margin-left: auto;
		color: #727568;
		font-size: 15px;
	}
	.toggle {
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
	.toggle span {
		font-size: 18px;
		line-height: 1;
	}
</style>
