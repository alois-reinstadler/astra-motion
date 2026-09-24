<script lang="ts">
	import { motion, createLayout } from '$lib/motion/index.js';
	const layout = createLayout({ transition: { type: 'spring', stiffness: 340, damping: 32 } });
	let mode = $state<'grid' | 'stack'>('grid');
	let reversed = $state(false);
	const pieces = [
		{ id: '01', name: 'Make a plan', color: 'coral' },
		{ id: '02', name: 'Try an idea', color: 'lime' },
		{ id: '03', name: 'Find your rhythm', color: 'cream' }
	];
	const ordered = $derived(reversed ? [...pieces].reverse() : pieces);
</script>

<div id="layout-playground" class="home-layout">
	<div class="playground-bar"><span>LAYOUT IN PRACTICE</span><span>TRY IT</span></div>
	<div class="playground-stage" class:stack={mode === 'stack'}>
		{#each ordered as piece (piece.id)}
			<motion.div class="motion-piece {piece.color}" motion={{ layout: true, layoutGroup: layout }}>
				<span class="piece-symbol" aria-hidden="true" {@attach layout({ mode: 'position' })}
					>{piece.id}</span
				>
				<strong {@attach layout({ mode: 'position' })}>{piece.name}</strong>
			</motion.div>
		{/each}
	</div>
	<div class="playground-controls">
		<div class="view-switch" role="group" aria-label="Layout mode">
			<button
				class:active={mode === 'grid'}
				aria-pressed={mode === 'grid'}
				onclick={() => (mode = 'grid')}>Grid</button
			>
			<button
				class:active={mode === 'stack'}
				aria-pressed={mode === 'stack'}
				onclick={() => (mode = 'stack')}>Stack</button
			>
		</div>
		<button class="shuffle" onclick={() => (reversed = !reversed)}>Reorder</button>
	</div>
	<p class="playground-caption">Change the layout. Reverse it while it moves.</p>
</div>

<style>
	.home-layout {
		min-width: 0;
	}
	.playground-bar {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1px;
		margin-bottom: 18px;
	}
	.playground-stage {
		background: #252b22;
		padding: 25px;
		min-height: 385px;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 13px;
		align-content: center;
		overflow: hidden;
		background-image: radial-gradient(#717a5f 0.8px, transparent 0.8px);
		background-size: 15px 15px;
	}
	.home-layout :global(.motion-piece) {
		height: 143px;
		padding: 20px;
		position: relative;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		color: #252821;
	}
	.home-layout :global(.motion-piece:first-child) {
		grid-row: span 2;
		height: 299px;
	}
	.home-layout :global(.coral) {
		background: #eb6b4c;
	}
	.home-layout :global(.lime) {
		background: #d6e3a4;
	}
	.home-layout :global(.cream) {
		background: #faf9ed;
	}
	.piece-symbol {
		font:
			52px/1 Georgia,
			serif;
		letter-spacing: -3px;
	}
	strong {
		font-size: 13px;
		font-weight: 550;
	}
	.playground-stage.stack {
		grid-template-columns: 1fr;
	}
	.stack :global(.motion-piece),
	.stack :global(.motion-piece:first-child) {
		height: 95px;
		grid-row: auto;
		flex-direction: row;
		align-items: center;
	}
	.playground-controls {
		display: flex;
		justify-content: space-between;
		padding: 16px 0;
		border-bottom: 1px solid #d9d8d0;
	}
	.view-switch {
		display: flex;
		border: 1px solid #d9d8d0;
		padding: 3px;
	}
	button {
		background: none;
		border: 0;
		cursor: pointer;
		font: inherit;
		color: #252821;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	.view-switch button {
		padding: 8px 17px;
		font-size: 11px;
	}
	.view-switch .active {
		background: #252821;
		color: #fff;
	}
	.shuffle {
		font-size: 12px;
	}
	.playground-caption {
		font:
			11px/1.6 ui-monospace,
			monospace;
		color: #64695c;
		margin: 12px 0 0;
	}
	@media (max-width: 600px) {
		.playground-stage {
			padding: 18px;
			gap: 10px;
		}
		.home-layout :global(.motion-piece) {
			padding: 16px;
		}
	}
</style>
