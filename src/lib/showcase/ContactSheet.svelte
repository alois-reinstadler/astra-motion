<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { createLayout } from '$lib/motion/layout.js';
	import { photos, type Photo } from './collection.js';
	const layout = createLayout({ transition: { type: 'spring', stiffness: 360, damping: 34 } });
	let selected = $state<Photo | null>(null);
	let filter = $state<'All' | 'Land' | 'Water'>('All');
	let dense = $state(false);
	let ready = $state(false);
	let scene: HTMLElement;
	let returnId = '';
	const visible = $derived(photos.filter((photo) => filter === 'All' || photo.category === filter));
	onMount(() => {
		ready = true;
	});
	async function open(photo: Photo) {
		returnId = photo.id;
		layout.update(() => {
			selected = photo;
		});
		await tick();
		scene.querySelector<HTMLButtonElement>('[data-contact-close]')?.focus({ preventScroll: true });
	}
	async function close() {
		layout.update(() => {
			selected = null;
		});
		await tick();
		scene
			.querySelector<HTMLButtonElement>(`[data-contact-open="${returnId}"]`)
			?.focus({ preventScroll: true });
	}
	function step(direction: number) {
		if (!selected) return;
		const index = visible.findIndex((photo) => photo.id === selected?.id);
		layout.update(() => {
			selected = visible[(index + direction + visible.length) % visible.length];
		});
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (selected && event.key === 'Escape' && scene?.contains(document.activeElement)) {
			event.stopPropagation();
			void close();
		}
	}}
/>

<div
	class="contact"
	{@attach (node) => {
		scene = node;
	}}
	data-testid="contact-sheet"
>
	<div class="toolbar">
		<div class="collection-name">
			<span class="dot"></span> EARTH, IN OTHER WORDS <small>VOL. 01</small>
		</div>
		<span class="count">{selected ? 'Loupe view' : `${visible.length} photographs`}</span>
	</div>
	{#if selected}
		<div class="detail">
			<div class="detail-tools">
				<button data-contact-close onclick={close}>← Contact sheet</button>
				<div>
					<button aria-label="Previous photograph" onclick={() => step(-1)}>←</button><button
						aria-label="Next photograph"
						onclick={() => step(1)}>→</button
					>
				</div>
			</div>
			{#key selected.id}
				<div class="detail-grid">
					<div
						class="photo-frame"
						{@attach layout({ id: `frame-${selected.id}`, style: { borderRadius: 4 } })}
					>
						<img
							src={selected.src}
							alt={selected.alt}
							{@attach layout({ id: `photo-${selected.id}`, mode: 'preserve-aspect' })}
						/>
					</div>
					<div class="detail-copy" {@attach layout({ mode: 'position' })}>
						<span class="folio"
							>FIELD NOTE / 0{photos.findIndex((photo) => photo.id === selected?.id) + 1}</span
						>
						<h3 {@attach layout({ id: `title-${selected.id}`, mode: 'position' })}>
							{selected.title}
						</h3>
						<p class="location">{selected.location}</p>
						<p class="note">{selected.note}</p>
						<div class="meta">
							<span>COLLECTION</span><strong>Earth, in other words</strong><span>IMAGE CREDIT</span
							><strong>NASA Image Library</strong>
						</div>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve --><!-- External NASA record, not an application route. -->
						<a href={selected.source} target="_blank" rel="noreferrer">Original photograph ↗</a>
					</div>
				</div>
			{/key}
		</div>
	{:else}
		<div class="filters">
			<div role="group" aria-label="Filter photographs">
				{#each ['All', 'Land', 'Water'] as category (category)}<button
						disabled={!ready}
						aria-pressed={filter === category}
						onclick={() =>
							layout.update(() => {
								filter = category as typeof filter;
							})}>{category}</button
					>{/each}
			</div>
			<button
				class="density"
				disabled={!ready}
				aria-pressed={dense}
				onclick={() =>
					layout.update(() => {
						dense = !dense;
					})}>{dense ? '⊞  Comfortable' : '▦  Compact'}</button
			>
		</div>
		<div class="sheet" class:dense>
			{#each visible as photo (photo.id)}
				<button
					class="photo"
					data-contact-open={photo.id}
					disabled={!ready}
					onclick={() => open(photo)}
					aria-label={`Open ${photo.title}`}
					{@attach layout({ mode: 'position' })}
				>
					<div
						class="photo-frame"
						{@attach layout({ id: `frame-${photo.id}`, style: { borderRadius: 4 } })}
					>
						<img
							src={photo.src}
							alt={photo.alt}
							{@attach layout({ id: `photo-${photo.id}`, mode: 'preserve-aspect' })}
						/><span class="expand" aria-hidden="true" {@attach layout({ mode: 'position' })}>↗</span
						>
					</div>
					<div class="photo-caption" {@attach layout({ mode: 'position' })}>
						<h3 {@attach layout({ id: `title-${photo.id}`, mode: 'position' })}>{photo.title}</h3>
						<span>0{photos.indexOf(photo) + 1}</span>
						<p>{photo.location}</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}
	<div class="contact-footer">
		<span>AN ORBITAL PERSPECTIVE</span><span
			>Photography: NASA <span aria-hidden="true">↗</span></span
		>
	</div>
</div>

<style>
	.contact {
		background: #222720;
		color: #f5f3e9;
		border-radius: 12px;
		overflow: hidden;
		min-width: 0;
	}
	.toolbar,
	.contact-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 22px 28px;
		border-bottom: 1px solid #ffffff1a;
	}
	.collection-name,
	.count,
	.contact-footer,
	.folio {
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1.4px;
	}
	.collection-name {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.collection-name small {
		color: #9da692;
		font-size: 9px;
		margin-left: 12px;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #e98562;
	}
	.count {
		color: #bdc5b3;
		letter-spacing: 0;
	}
	.filters {
		padding: 20px 28px;
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	.filters > div {
		display: flex;
		gap: 4px;
	}
	button {
		font: inherit;
		cursor: pointer;
		color: inherit;
		border: 0;
		background: none;
	}
	button:disabled {
		cursor: wait;
	}
	button:focus-visible,
	a:focus-visible {
		outline: 2px solid #e98562;
		outline-offset: 5px;
	}
	.filters button {
		padding: 8px 15px;
		border-radius: 5px;
		font-size: 12px;
		color: #bac1b2;
	}
	.filters button[aria-pressed='true'] {
		background: #f5f3e9;
		color: #222720;
	}
	.filters .density {
		border: 1px solid #ffffff25;
	}
	.sheet {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 26px;
		padding: 0 28px 30px;
	}
	.sheet.dense {
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 16px;
	}
	.photo {
		text-align: left;
		min-width: 0;
		padding: 0;
	}
	.photo-frame {
		/* Integer 3:2 geometry avoids Safari projection-box rounding changing the crop. */
		width: round(down, 100%, 3px);
		position: relative;
		aspect-ratio: 3/2;
		border-radius: 4px;
		overflow: hidden;
		background: #40483a;
	}
	.photo-frame img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		aspect-ratio: 3/2;
	}
	.expand {
		position: absolute;
		right: 12px;
		bottom: 12px;
		background: #f5f3e9;
		color: #222720;
		width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		opacity: 0;
	}
	.photo:hover .expand,
	.photo:focus-visible .expand {
		opacity: 1;
	}
	.photo-caption {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 6px;
		padding-top: 14px;
	}
	.photo-caption h3 {
		font:
			500 16px 'Instrument Sans Variable',
			sans-serif;
		margin: 0;
		letter-spacing: -0.3px;
	}
	.photo-caption > span {
		font:
			10px ui-monospace,
			monospace;
		color: #909b86;
	}
	.photo-caption p {
		grid-column: 1/-1;
		margin: 0;
		font-size: 11px;
		color: #a8b29d;
	}
	.contact-footer {
		border-top: 1px solid #ffffff1a;
		border-bottom: 0;
		color: #a8b29d;
		font-size: 9px;
	}
	.detail {
		padding: 0 28px 30px;
	}
	.detail-tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 0 22px;
	}
	.detail-tools button {
		padding: 8px 0;
		font-size: 12px;
	}
	.detail-tools > div {
		display: flex;
		gap: 24px;
	}
	.detail-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.65fr) minmax(180px, 1fr);
		gap: 34px;
		align-items: start;
	}
	.detail-copy {
		padding: 10px 0;
	}
	.folio {
		color: #e98562;
		font-size: 9px;
	}
	.detail-copy h3 {
		font:
			normal clamp(25px, 3vw, 42px)/1.07 Georgia,
			serif;
		letter-spacing: -1px;
		margin: 20px 0 12px;
	}
	.location {
		font-size: 11px;
		color: #b4bea9;
	}
	.note {
		font-size: 13px;
		line-height: 1.8;
		color: #c0c6b7;
		margin: 26px 0;
	}
	.meta {
		display: grid;
		grid-template-columns: 1fr;
		gap: 7px;
		padding-top: 18px;
		border-top: 1px solid #ffffff25;
	}
	.meta span {
		font:
			8px ui-monospace,
			monospace;
		letter-spacing: 1px;
		color: #929e85;
	}
	.meta strong {
		font-weight: 400;
		font-size: 11px;
		margin-bottom: 12px;
	}
	.detail-copy a {
		display: inline-block;
		font-size: 11px;
		color: #e98562;
		margin-top: 10px;
		text-underline-offset: 5px;
	}
	@media (max-width: 800px) {
		.sheet.dense {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.detail-grid {
			grid-template-columns: 1fr;
		}
		.detail-copy {
			max-width: 440px;
		}
		.detail-copy h3 {
			font-size: 34px;
		}
		.collection-name small {
			display: none;
		}
	}
	@media (max-width: 520px) {
		.toolbar,
		.contact-footer {
			padding: 18px;
		}
		.collection-name {
			font-size: 8px;
			letter-spacing: 0.6px;
		}
		.count {
			font-size: 9px;
		}
		.filters {
			padding: 18px;
			gap: 6px;
		}
		.filters button {
			padding: 8px 10px;
			font-size: 11px;
		}
		.sheet {
			padding: 0 18px 24px;
			grid-template-columns: 1fr;
			gap: 24px;
		}
		.sheet.dense {
			gap: 14px;
		}
		.photo-caption h3 {
			font-size: 14px;
		}
		.dense .photo-caption h3 {
			font-size: 12px;
		}
		.dense .photo-caption p {
			font-size: 9px;
		}
		.detail {
			padding: 0 18px 24px;
		}
		.contact-footer {
			font-size: 7px;
			letter-spacing: 0.8px;
		}
	}
</style>
