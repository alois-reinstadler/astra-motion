<script lang="ts">
	import { createMotion } from '$lib/motion/motion.svelte.js';
	import { popLayout } from '$lib/motion/presence.js';
	import type { LayoutController } from '$lib/motion/layout.js';
	import type { photos } from './collection.js';

	let {
		photo,
		index,
		total,
		compact,
		layout,
		onmove,
		onremove
	}: {
		photo: (typeof photos)[number];
		index: number;
		total: number;
		compact: boolean;
		layout: LayoutController;
		onmove: (direction: -1 | 1) => void;
		onremove: () => void;
	} = $props();
	const row = createMotion(() => ({
		initial: 'arriving',
		animate: 'ready',
		exit: 'leaving',
		variants: {
			arriving: { opacity: 0, y: 14 },
			ready: { opacity: 1, y: 0 },
			leaving: { opacity: 0, y: -10, transition: { duration: 0.2 } }
		},
		layout: true,
		layoutGroup: layout,
		transition: { type: 'spring', stiffness: 430, damping: 38 },
		style: { borderRadius: 10 }
	}));
	const transition = row.transition;
</script>

<li
	class:compact
	class="queue-item"
	data-queue-item={photo.id}
	{...row.props}
	transition:transition|global
	{@attach popLayout()}
>
	<span
		class="sequence"
		aria-label={`Position ${index + 1} of ${total}`}
		{@attach layout({ mode: 'position' })}
	>
		{String(index + 1).padStart(2, '0')}
	</span>
	<div class="thumbnail" data-queue-thumbnail {@attach layout({ mode: 'preserve-aspect' })}>
		<img src={photo.src} alt={photo.alt} width="360" height="240" />
	</div>
	<div class="caption" data-queue-caption {@attach layout({ mode: 'position' })}>
		<span class="location">{photo.location}</span>
		<h4>{photo.title}</h4>
		{#if !compact}<p>Earth studies / archival selection</p>{/if}
	</div>
	<div class="item-actions" {@attach layout({ mode: 'position' })}>
		<div class="move-buttons">
			<button
				type="button"
				onclick={() => onmove(-1)}
				aria-label={`Move ${photo.title} earlier`}
				aria-disabled={index === 0}
				data-queue-action="earlier"
				title="Move earlier"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg>
			</button>
			<button
				type="button"
				onclick={() => onmove(1)}
				aria-label={`Move ${photo.title} later`}
				aria-disabled={index === total - 1}
				data-queue-action="later"
				title="Move later"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6" /></svg>
			</button>
		</div>
		<button
			class="remove"
			type="button"
			onclick={onremove}
			aria-label={`Remove ${photo.title}`}
			data-queue-action="remove"
			title="Remove from issue"
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
		</button>
	</div>
</li>

<style>
	.queue-item {
		position: relative;
		display: grid;
		grid-template-columns: 25px 138px minmax(0, 1fr) auto;
		align-items: center;
		gap: 18px;
		min-height: 128px;
		padding: 17px 18px;
		background: #f5f3e9;
		color: #222720;
		list-style: none;
	}
	.queue-item.compact {
		grid-template-columns: 25px 84px minmax(0, 1fr) auto;
		min-height: 86px;
		padding-block: 12px;
	}
	.sequence {
		font:
			11px ui-monospace,
			monospace;
		color: #626b5b;
		align-self: start;
		padding-top: 4px;
	}
	.thumbnail {
		width: 100%;
		aspect-ratio: 3 / 2;
		overflow: hidden;
		border-radius: 5px;
		background: #d9ddcc;
	}
	.thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.caption {
		min-width: 0;
	}
	.location {
		display: block;
		color: #626b5b;
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	h4 {
		font-family: Georgia, serif;
		font-size: clamp(20px, 2.4vw, 27px);
		font-weight: 400;
		letter-spacing: -0.025em;
		line-height: 1.15;
		margin: 7px 0;
	}
	.caption p {
		margin: 0;
		color: #626b5b;
		font-size: 11px;
		line-height: 1.4;
	}
	.item-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.move-buttons {
		display: flex;
		flex-direction: column;
	}
	button {
		display: grid;
		place-items: center;
		width: 32px;
		height: 30px;
		padding: 0;
		background: transparent;
		border: 0;
		border-radius: 4px;
		color: inherit;
		cursor: pointer;
	}
	button:hover {
		background: #e4e7d9;
	}
	button[aria-disabled='true'] {
		color: #b0b5a7;
		cursor: default;
	}
	button[aria-disabled='true']:hover {
		background: transparent;
	}
	button:focus-visible {
		outline: 2px solid #b34024;
		outline-offset: 2px;
	}
	button.remove {
		width: 32px;
		height: 36px;
		color: #797e72;
	}
	button.remove:hover {
		background: #f3ded3;
		color: #af4027;
	}
	svg {
		width: 17px;
		height: 17px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	@media (max-width: 650px) {
		.queue-item {
			grid-template-columns: 18px 80px minmax(0, 1fr);
			gap: 10px;
			padding: 14px 12px;
			min-height: 116px;
		}
		.queue-item.compact {
			grid-template-columns: 18px 56px minmax(0, 1fr);
			min-height: 92px;
			padding-block: 10px;
		}
		.item-actions {
			grid-column: 3;
			gap: 3px;
			justify-content: flex-end;
			margin-top: -5px;
		}
		.move-buttons {
			flex-direction: row;
		}
		button {
			width: 32px;
			height: 28px;
		}
		button.remove {
			height: 28px;
		}
		.caption p {
			display: none;
		}
		.location {
			font-size: 8px;
			letter-spacing: 0.04em;
		}
		h4 {
			font-size: 20px;
			margin: 5px 0 0;
		}
	}
</style>
