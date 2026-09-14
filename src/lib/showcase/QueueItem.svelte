<script lang="ts">
	import { flushSync, onDestroy } from 'svelte';
	import { motionValue } from '$lib/motion/values.js';
	import type { Attachment } from 'svelte/attachments';
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
		onremove,
		ondrag,
		ondragend
	}: {
		photo: (typeof photos)[number];
		index: number;
		total: number;
		compact: boolean;
		layout: LayoutController;
		onmove: (direction: -1 | 1) => void;
		onremove: () => void;
		ondrag: (center: number, delta: number) => void;
		ondragend: (cancelled: boolean) => void;
	} = $props();
	let dragging = $state(false);
	const dragY = motionValue(0);
	onDestroy(() => dragY.destroy());
	const handleDrag: Attachment<HTMLButtonElement> = (handle) => {
		const node = handle.closest('li')!;
		const abort = new AbortController();
		let pointer: number | undefined;
		let grabOffset = 0;
		let previousY = 0;
		function finish(cancelled: boolean) {
			if (pointer === undefined) return;
			const released = pointer;
			pointer = undefined;
			if (handle.hasPointerCapture(released)) handle.releasePointerCapture(released);
			flushSync(() => {
				dragging = false;
			});
			ondragend(cancelled);
			void row.animate({ y: 0, scale: 1, boxShadow: '0 0 0 #22272000' });
		}
		function move(event: PointerEvent) {
			if (event.pointerId !== pointer) return;
			const center = event.clientY - grabOffset;
			ondrag(center, event.clientY - previousY);
			previousY = event.clientY;
			// The placeholder can change position while the lifted card stays under the grip.
			const list = node.offsetParent as HTMLElement;
			dragY.set(
				center - (list.getBoundingClientRect().top + node.offsetTop + node.offsetHeight / 2)
			);
		}
		handle.addEventListener(
			'pointerdown',
			(event) => {
				if (!event.isPrimary || event.button !== 0 || pointer !== undefined) return;
				event.preventDefault();
				pointer = event.pointerId;
				row.stop();
				const box = node.getBoundingClientRect();
				grabOffset = event.clientY - (box.top + box.height / 2);
				previousY = event.clientY;
				flushSync(() => {
					dragging = true;
				});
				handle.focus({ preventScroll: true });
				handle.setPointerCapture(pointer);
				void row.animate(
					{ opacity: 1, scale: 1.025, boxShadow: '0 16px 32px #22272030' },
					{ duration: 0.16 }
				);
			},
			{ signal: abort.signal }
		);
		window.addEventListener('pointermove', move, { signal: abort.signal });
		window.addEventListener(
			'pointerup',
			(event) => {
				if (event.pointerId !== pointer) return;
				move(event);
				finish(false);
			},
			{ signal: abort.signal }
		);
		window.addEventListener(
			'pointercancel',
			(event) => {
				if (event.pointerId === pointer) finish(true);
			},
			{ signal: abort.signal }
		);
		handle.addEventListener('lostpointercapture', () => finish(true), { signal: abort.signal });
		window.addEventListener('blur', () => finish(true), { signal: abort.signal });
		window.addEventListener(
			'keydown',
			(event) => {
				if (event.key === 'Escape' && pointer !== undefined) {
					event.preventDefault();
					finish(true);
				}
			},
			{ signal: abort.signal }
		);
		return () => {
			pointer = undefined;
			abort.abort();
		};
	};
	const row = createMotion(() => ({
		initial: 'arriving',
		animate: 'ready',
		exit: 'leaving',
		variants: {
			arriving: { opacity: 0, y: 14 },
			ready: { opacity: 1, y: 0 },
			leaving: { opacity: 0, y: -10, transition: { duration: 0.2 } }
		},
		layout: !dragging,
		layoutGroup: layout,
		transition: { type: 'spring', stiffness: 430, damping: 38 },
		style: { borderRadius: 10, y: dragY }
	}));
	const transition = row.transition;
</script>

<li
	class:dragging
	class:compact
	class="queue-item"
	data-queue-item={photo.id}
	style:order={index}
	{...row.props}
	transition:transition|global
	{@attach popLayout()}
>
	<div class="sequence-stack" {@attach dragging ? undefined : layout({ mode: 'position' })}>
		<span class="sequence" role="img" aria-label={`Position ${index + 1} of ${total}`}>
			{String(index + 1).padStart(2, '0')}
		</span>
	</div>
	<div
		class="thumbnail"
		data-queue-thumbnail
		{@attach dragging ? undefined : layout({ mode: 'preserve-aspect' })}
	>
		<img src={photo.src} alt={photo.alt} width="360" height="240" />
	</div>
	<div
		class="caption"
		data-queue-caption
		{@attach dragging ? undefined : layout({ mode: 'position' })}
	>
		<span class="location">{photo.location}</span>
		<h4>{photo.title}</h4>
		{#if !compact}<p>Earth studies / archival selection</p>{/if}
	</div>
	<div class="item-actions" {@attach dragging ? undefined : layout({ mode: 'position' })}>
		<button
			type="button"
			class="drag-handle"
			data-queue-drag
			{@attach handleDrag}
			aria-label={`Drag ${photo.title} to reorder`}
			aria-describedby="queue-drag-hint"
			onkeydown={(event) => {
				if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
					event.preventDefault();
					onmove(event.key === 'ArrowUp' ? -1 : 1);
				}
			}}
			><svg viewBox="0 0 24 24" aria-hidden="true"
				><path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" /></svg
			></button
		>
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
		border-radius: 10px;
		overflow: hidden;
		isolation: isolate;
	}
	/* Only the handle captures touch drags; the rest of the row still scrolls. */
	.queue-item {
		touch-action: pan-y;
	}
	.queue-item.dragging {
		z-index: 5;
	}
	.sequence-stack {
		align-self: start;
		display: grid;
		justify-items: center;
		gap: 12px;
	}
	button.drag-handle {
		cursor: grab;
		touch-action: none;
		width: 28px;
		height: 34px;
		margin: 0;
		color: #626b5b;
	}
	.drag-handle svg {
		stroke-width: 3;
	}
	.dragging .drag-handle {
		cursor: grabbing;
		color: #af4027;
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
			grid-column: 2 / -1;
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
