<script lang="ts">
	import { tick } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { createLayout } from '$lib/motion/layout.js';
	import { createMotion } from '$lib/motion/lite.svelte.js';
	import QueueItem from './QueueItem.svelte';
	import { photos } from './collection.js';

	type Photo = (typeof photos)[number];
	let items = $state<Photo[]>(photos.slice(0, 3));
	let compact = $state(false);
	let removed = $state<{ photo: Photo; index: number } | null>(null);
	let announcement = $state('');
	let queue: HTMLUListElement | undefined;
	let addButton: HTMLButtonElement | undefined;
	const attachQueue: Attachment<HTMLUListElement> = (node) => {
		queue = node;
		return () => {
			queue = undefined;
		};
	};
	const attachAddButton: Attachment<HTMLButtonElement> = (node) => {
		addButton = node;
		return () => {
			addButton = undefined;
		};
	};
	const available = $derived(photos.filter((photo) => !items.some((item) => item.id === photo.id)));
	const layout = createLayout({ transition: { type: 'spring', stiffness: 430, damping: 38 } });
	const notice = createMotion({
		initial: { opacity: 0, y: 8 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: 8 },
		transition: { duration: 0.16 }
	});
	const noticeTransition = notice.transition;

	function move(id: string, direction: -1 | 1) {
		const from = items.findIndex((photo) => photo.id === id);
		const to = from + direction;
		if (from < 0 || to < 0 || to >= items.length) return;
		const focused =
			document.activeElement instanceof HTMLElement && queue?.contains(document.activeElement)
				? document.activeElement
				: undefined;
		layout.update(() => {
			const next = [...items];
			[next[from], next[to]] = [next[to], next[from]];
			items = next;
		});
		// Moving a keyed DOM node can clear browser focus even though it is retained.
		focused?.focus({ preventScroll: true });
		announcement = `${items[to].title} moved to position ${to + 1} of ${items.length}.`;
	}
	// Keep DOM nodes stationary during capture; commit their order on release.
	let dragOrder = $state.raw<Photo[] | undefined>();
	function drag(id: string, center: number, delta: number) {
		if (!queue || delta === 0) return;
		dragOrder ??= [...items];
		const from = items.findIndex((photo) => photo.id === id);
		const to = from + (delta > 0 ? 1 : -1);
		const neighbor = items[to];
		if (from < 0 || !neighbor) return;
		const node = queue.querySelector<HTMLElement>(`[data-queue-item="${neighbor.id}"]`);
		if (!node) return;
		// Use the destination layout, not a sibling's animated visual position.
		const midpoint = queue.getBoundingClientRect().top + node.offsetTop + node.offsetHeight / 2;
		if ((delta > 0 && center > midpoint) || (delta < 0 && center < midpoint)) {
			move(id, delta > 0 ? 1 : -1);
		}
	}
	function finishDrag(cancelled: boolean) {
		const focused =
			document.activeElement instanceof HTMLElement && queue?.contains(document.activeElement)
				? document.activeElement
				: undefined;
		layout.update(() => {
			if (cancelled && dragOrder) {
				items = dragOrder;
				announcement = 'Drag cancelled. Original sequence restored.';
			}
			dragOrder = undefined;
		});
		focused?.focus({ preventScroll: true });
	}

	async function add(photo = available[0]) {
		if (!photo || items.some((item) => item.id === photo.id)) return;
		const active = document.activeElement;
		const restoreFocus = active === addButton || active?.closest('.selection-photos') !== null;
		layout.update(() => {
			items = [...items, photo];
		});
		if (removed?.photo.id === photo.id) removed = null;
		await tick();
		const row = queue?.querySelector<HTMLElement>(`[data-queue-item="${photo.id}"]`);
		row?.removeAttribute('inert');
		if (restoreFocus)
			row
				?.querySelector<HTMLButtonElement>('[data-queue-action="earlier"]')
				?.focus({ preventScroll: true });
		announcement = `${photo.title} added to the issue. ${items.length} photographs selected.`;
	}
	async function remove(id: string) {
		const index = items.findIndex((photo) => photo.id === id);
		if (index < 0) return;
		const row = queue?.querySelector<HTMLElement>(`[data-queue-item="${id}"]`);
		const restoreFocus = row?.contains(document.activeElement);
		const photo = items[index];
		if (row) row.inert = true;
		layout.update(() => {
			items = items.filter((item) => item.id !== id);
		});
		removed = { photo, index };
		announcement = `${photo.title} removed. Undo is available.`;
		await tick();
		if (restoreFocus) {
			const next = items[Math.min(index, items.length - 1)];
			const button = next
				? queue?.querySelector<HTMLButtonElement>(
						`[data-queue-item="${next.id}"] [data-queue-action="remove"]`
					)
				: addButton;
			button?.focus({ preventScroll: true });
		}
	}
	async function undo() {
		if (!removed) return;
		const { photo, index } = removed;
		layout.update(() => {
			if (!items.some((item) => item.id === photo.id)) {
				const next = [...items];
				next.splice(Math.min(index, next.length), 0, photo);
				items = next;
			}
			removed = null;
		});
		await tick();
		const row = queue?.querySelector<HTMLElement>(`[data-queue-item="${photo.id}"]`);
		if (row) row.inert = false;
		row
			?.querySelector<HTMLButtonElement>('[data-queue-action="remove"]')
			?.focus({ preventScroll: true });
		announcement = `${photo.title} restored to the issue.`;
	}
	function reverse() {
		layout.update(() => {
			items = [...items].reverse();
		});
		announcement = 'The issue sequence has been reversed.';
	}
</script>

<div class="publishing-queue" data-testid="publishing-queue">
	<div class="desk-header">
		<div class="issue">
			<span class="issue-mark" aria-hidden="true">F.</span>
			<div>
				<span class="eyebrow">The publishing desk</span>
				<h3>Issue 004 <span>/</span> Earth, abstracted.</h3>
			</div>
		</div>
		<span class="draft"><span aria-hidden="true"></span>Local draft</span>
	</div>
	<div class="desk-body">
		<div class="sequence-panel">
			<div class="sequence-toolbar">
				<div class="sequence-title">
					The sequence <span>{String(items.length).padStart(2, '0')}</span>
				</div>
				<div class="toolbar-buttons">
					<button
						type="button"
						onclick={reverse}
						disabled={items.length < 2}
						data-testid="queue-reverse"
						title="Reverse the sequence"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4" /></svg
						><span>Reverse</span>
					</button>
					<button
						type="button"
						aria-pressed={compact}
						onclick={() =>
							layout.update(() => {
								compact = !compact;
							})}
						data-testid="queue-density"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16" /></svg
						><span>Compact</span>
					</button>
				</div>
			</div>
			<p id="queue-drag-hint" class="sr-only">
				Drag the grip to reorder. With the grip focused, use the up and down arrow keys. Escape
				cancels a drag.
			</p>
			<ul
				class="sequence-list"
				{@attach attachQueue}
				aria-label="Issue photograph sequence"
				data-testid="queue-list"
			>
				{#each dragOrder ?? items as photo (photo.id)}
					<QueueItem
						{photo}
						index={items.findIndex((item) => item.id === photo.id)}
						total={items.length}
						{compact}
						{layout}
						onmove={(direction) => move(photo.id, direction)}
						onremove={() => void remove(photo.id)}
						ondrag={(center, delta) => drag(photo.id, center, delta)}
						ondragend={finishDrag}
					/>
				{/each}
			</ul>
			{#if items.length === 0}<div class="empty">
					<h4>A clean slate.</h4>
					<p>Bring a photograph into the sequence to begin again.</p>
				</div>{/if}
			<div class="queue-footer">
				<span>{items.length} of {photos.length} photographs selected</span><span
					>Drag to reorder.</span
				>
			</div>
		</div>
		<aside class="selection-panel" aria-label="Photograph selection">
			<div class="selection-heading">
				<span class="eyebrow">On the light table</span><span class="selection-count"
					>{available.length} available</span
				>
			</div>
			<div class="selection-photos">
				{#each photos as photo (photo.id)}
					{@const selected = items.some((item) => item.id === photo.id)}
					<button
						type="button"
						class:selected
						disabled={selected}
						onclick={() => add(photo)}
						aria-label={selected ? `${photo.title} is in the issue` : `Add ${photo.title}`}
					>
						<img src={photo.src} alt="" width="144" height="96" />
						<span class="photo-label">{photo.title}</span><span
							class="photo-state"
							aria-hidden="true">{selected ? '✓' : '+'}</span
						>
					</button>
				{/each}
			</div>
			<button
				class="add-button"
				type="button"
				onclick={() => add()}
				disabled={!available.length}
				{@attach attachAddButton}
				data-testid="queue-add"
				><span>+</span>{available.length ? 'Add a photograph' : 'All photographs added'}</button
			>
			<div class="editor-note">
				<span class="note-number">04 / EDITOR'S NOTE</span>
				<p>Let one image answer the next.</p>
				<span>Drag a handle, or use the arrows to find a rhythm. Nothing here is published.</span>
			</div>
		</aside>
	</div>
	<div class="undo-slot">
		{#if removed}<div class="undo-notice" {...notice.props} transition:noticeTransition>
				<span><strong>{removed.photo.title}</strong> removed from the issue.</span><button
					type="button"
					onclick={() => void undo()}
					data-testid="queue-undo"
					>Undo
				</button>
			</div>{/if}
	</div>
	<p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
</div>

<style>
	.publishing-queue {
		color: #f5f3e9;
		background: #222720;
		border-radius: 14px;
		overflow: hidden;
		font-family: 'Instrument Sans', sans-serif;
		box-shadow: 0 16px 45px #22272014;
	}
	.desk-header {
		padding: 25px 28px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		border-bottom: 1px solid #ffffff1c;
	}
	.issue {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.issue-mark {
		display: grid;
		place-items: center;
		width: 40px;
		height: 44px;
		color: #222720;
		background: #dbe6bc;
		font-family: Georgia, serif;
		font-size: 29px;
	}
	.eyebrow {
		display: block;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: #abb59e;
	}
	h3 {
		margin: 6px 0 0;
		font-size: 16px;
		font-weight: 450;
		letter-spacing: -0.025em;
	}
	h3 span {
		color: #76806b;
		padding: 0 5px;
	}
	.draft {
		display: flex;
		align-items: center;
		gap: 7px;
		white-space: nowrap;
		font-size: 10px;
		color: #c3cbb7;
	}
	.draft > span {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #bace94;
	}
	.desk-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 240px;
	}
	.sequence-panel {
		min-width: 0;
		padding: 22px 22px 15px;
	}
	.sequence-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
		margin-bottom: 17px;
	}
	.sequence-title {
		font-size: 12px;
		white-space: nowrap;
	}
	.sequence-title > span {
		color: #b8c59f;
		font:
			10px ui-monospace,
			monospace;
		margin-left: 8px;
		border: 1px solid #ffffff25;
		border-radius: 3px;
		padding: 2px 5px;
	}
	.toolbar-buttons {
		display: flex;
		gap: 6px;
	}
	.toolbar-buttons button {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 10px;
		background: #ffffff07;
		border: 1px solid #ffffff20;
		color: #c9d0bf;
		padding: 7px 9px;
		border-radius: 5px;
		cursor: pointer;
	}
	.toolbar-buttons button:hover {
		background: #ffffff12;
	}
	.toolbar-buttons button[aria-pressed='true'] {
		background: #dbe6bc;
		border-color: #dbe6bc;
		color: #222720;
	}
	button:focus-visible {
		outline: 2px solid #e9a887;
		outline-offset: 3px;
	}
	button:disabled {
		cursor: default;
	}
	.toolbar-buttons button:disabled {
		opacity: 0.4;
	}
	svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.sequence-list {
		position: relative;
		display: grid;
		gap: 10px;
		padding: 0;
		margin: 0;
	}
	.queue-footer {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 9px;
		color: #8f9b80;
		padding-top: 18px;
	}
	.selection-panel {
		background: #2c3327;
		padding: 23px 19px;
		border-left: 1px solid #ffffff13;
	}
	.selection-heading .eyebrow {
		font-size: 9px;
	}
	.selection-count {
		display: block;
		color: #a7b399;
		font-size: 10px;
		margin-top: 5px;
	}
	.selection-photos {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin: 20px 0 16px;
	}
	.selection-photos button {
		display: block;
		min-width: 0;
		position: relative;
		text-align: left;
		padding: 0;
		border: 1px solid #758363;
		border-radius: 5px;
		overflow: hidden;
		color: #e5ebda;
		background: #36402f;
		cursor: pointer;
	}
	.selection-photos button:hover:not(:disabled) {
		border-color: #dbe6bc;
	}
	.selection-photos button.selected {
		border-color: transparent;
	}
	.selection-photos button.selected img {
		opacity: 0.45;
	}
	.selection-photos img {
		display: block;
		width: 100%;
		aspect-ratio: 3 / 2;
		height: auto;
		object-fit: cover;
	}
	.photo-label {
		display: block;
		padding: 7px 6px;
		font-size: 9px;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
	.photo-state {
		position: absolute;
		top: 5px;
		right: 5px;
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		color: #222720;
		background: #dbe6bc;
		border-radius: 50%;
		font-size: 12px;
	}
	.add-button {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 11px 8px;
		border: 0;
		border-radius: 5px;
		color: #222720;
		background: #dbe6bc;
		font-size: 11px;
		cursor: pointer;
	}
	.add-button:not(:disabled):hover {
		background: #e7efce;
	}
	.add-button:disabled {
		background: #45503b;
		color: #a8b598;
	}
	.add-button > span {
		font-size: 17px;
	}
	.editor-note {
		border-top: 1px solid #ffffff1a;
		margin-top: 27px;
		padding-top: 20px;
	}
	.note-number {
		color: #95a184;
		font:
			8px ui-monospace,
			monospace;
		letter-spacing: 0.07em;
	}
	.editor-note p {
		font:
			23px/1.15 Georgia,
			serif;
		letter-spacing: -0.025em;
		margin: 10px 0;
		color: #e8ecdc;
	}
	.editor-note > span:last-child {
		color: #b4bea9;
		font-size: 10px;
		line-height: 1.6;
		display: block;
	}
	.undo-slot {
		min-height: 57px;
		padding: 0 22px 14px;
	}
	.undo-notice {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		color: #e7edda;
		background: #3e4a33;
		padding: 10px 13px;
		border: 1px solid #ffffff15;
		border-radius: 6px;
		font-size: 11px;
	}
	.undo-notice strong {
		font-weight: 500;
	}
	.undo-notice button {
		border: 0;
		background: transparent;
		color: #dbe6bc;
		cursor: pointer;
		font-size: 11px;
		text-decoration: underline;
		text-underline-offset: 3px;
		white-space: nowrap;
	}

	.empty {
		text-align: center;
		padding: 46px 15px;
		border: 1px dashed #647255;
		border-radius: 10px;
	}
	.empty > span {
		font-size: 30px;
		color: #c2d09f;
	}
	.empty h4 {
		font:
			30px Georgia,
			serif;
		margin: 9px 0;
	}
	.empty p {
		font-size: 11px;
		color: #9fac90;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@media (max-width: 1000px) {
		.desk-body {
			grid-template-columns: minmax(0, 1fr);
		}
		.selection-panel {
			border-left: 0;
			border-top: 1px solid #ffffff13;
			display: grid;
			grid-template-columns: 1fr auto;
			gap: 12px 20px;
		}
		.selection-heading {
			align-self: center;
		}
		.selection-photos {
			grid-column: 1 / -1;
			grid-row: 2;
			grid-template-columns: repeat(4, minmax(0, 1fr));
			margin: 0;
		}
		.add-button {
			width: auto;
			align-self: center;
		}
		.editor-note {
			display: none;
		}
		.undo-slot {
			padding-top: 14px;
			min-height: 66px;
		}
	}
	@media (max-width: 650px) {
		.desk-header {
			padding: 19px 16px;
		}
		.issue-mark {
			width: 33px;
			height: 38px;
			font-size: 25px;
		}
		.issue {
			gap: 11px;
		}
		h3 {
			font-size: 12px;
		}
		.eyebrow {
			font-size: 8px;
		}
		.draft {
			display: none;
		}
		.sequence-panel {
			padding: 18px 12px 15px;
		}
		.sequence-toolbar {
			gap: 8px;
		}
		.toolbar-buttons button {
			padding: 6px;
			font-size: 9px;
		}
		.sequence-title {
			font-size: 10px;
		}
		.sequence-title > span {
			margin-left: 3px;
		}
		.selection-panel {
			padding: 17px 13px;
			gap: 12px;
		}
		.selection-photos {
			gap: 7px;
		}
		.photo-label {
			font-size: 8px;
		}
		.queue-footer {
			font-size: 8px;
		}
		.queue-footer span:last-child {
			display: none;
		}
		.undo-slot {
			padding-inline: 12px;
		}
		.undo-notice {
			font-size: 10px;
		}
	}
</style>
