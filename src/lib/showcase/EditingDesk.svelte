<script lang="ts">
	import { onMount } from 'svelte';
	import { createLayout } from '$lib/motion/layout.js';
	import { createMotion } from '$lib/motion/lite.svelte.js';
	import { photos } from './collection.js';
	const layout = createLayout({ transition: { type: 'spring', stiffness: 390, damping: 36 } });
	const inspectorMotion = createMotion({
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.14 }
	});
	const inspectorTransition = inspectorMotion.transition;
	let dock = $state<'left' | 'right'>('right');
	let inspector = $state(true);
	let tab = $state<'Story' | 'Cover'>('Story');
	let caption = $state('A quiet immensity');
	let subtitle = $state('Notes from a planet in motion.');
	let accent = $state<'moss' | 'coral'>('moss');
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
</script>

<div class="desk" data-testid="editing-desk">
	<div class="desk-toolbar">
		<div class="document">
			<span aria-hidden="true">▧</span>
			<div><strong>Earth, in other words</strong><small>Issue 01 / working draft</small></div>
		</div>
		<button
			disabled={!ready}
			aria-pressed={inspector}
			onclick={() =>
				layout.update(() => {
					inspector = !inspector;
				})}
			>{inspector ? 'Hide inspector' : 'Show inspector'} <span aria-hidden="true">◧</span></button
		>
	</div>
	<div class="workspace" class:left={dock === 'left'} class:wide={!inspector}>
		<div class="canvas-area" {@attach layout({ mode: 'position' })}>
			<div class="canvas-tabs" role="group" aria-label="Preview format">
				{#each ['Story', 'Cover'] as name (name)}<button
						disabled={!ready}
						aria-pressed={tab === name}
						onclick={() =>
							layout.update(() => {
								tab = name as typeof tab;
							})}
						>{#if tab === name}<span
								class="active-tab"
								{@attach layout({ id: 'desk-tab', style: { borderRadius: 5 } })}
							></span>{/if}<span class="tab-label">{name}</span></button
					>{/each}
			</div>
			<div
				class="canvas"
				class:cover={tab === 'Cover'}
				class:coral={accent === 'coral'}
				data-testid="desk-canvas"
				{@attach layout({ style: { borderRadius: 3 } })}
			>
				<div class="paper-top" {@attach layout()}>
					<span {@attach layout({ mode: 'position' })}>FIELDWORK</span><span
						data-testid="desk-edition"
						{@attach layout({ mode: 'position' })}>01 / EARTH</span
					>
				</div>
				<div class="cover-copy" {@attach layout({ mode: 'position' })}>
					<p>AN INDEPENDENT JOURNAL</p>
					<h3>{caption || 'Untitled story'}</h3>
					<span>{subtitle || 'Your story starts here.'}</span>
				</div>
				<div class="canvas-image" {@attach layout({ mode: 'preserve-aspect' })}>
					<img src={photos[0].src} alt={photos[0].alt} />
				</div>
				<div class="paper-bottom" {@attach layout()}>
					<span {@attach layout({ mode: 'position' })}>Look a little closer.</span><span
						data-testid="desk-arrow"
						aria-hidden="true"
						{@attach layout({ mode: 'position' })}>↗</span
					>
				</div>
			</div>
			<div class="canvas-status">
				<span class="status-dot"></span> Local preview <span>Edits stay in this page</span>
			</div>
		</div>
		{#if inspector}
			<aside
				class="inspector"
				{...inspectorMotion.props}
				transition:inspectorTransition
				{@attach layout({ mode: 'position' })}
			>
				<div class="inspector-title">
					<h3>Story settings</h3>
					<span>↗</span>
				</div>
				<label for="desk-title">Headline</label><input
					id="desk-title"
					maxlength="60"
					bind:value={caption}
				/>
				<label for="desk-subtitle">Deck</label><textarea
					id="desk-subtitle"
					rows="3"
					maxlength="140"
					bind:value={subtitle}></textarea>
				<fieldset>
					<legend>Paper tone</legend>
					<div class="swatches">
						<button
							disabled={!ready}
							class="moss"
							aria-label="Moss paper"
							aria-pressed={accent === 'moss'}
							onclick={() => {
								accent = 'moss';
							}}>{accent === 'moss' ? '✓' : ''}</button
						><button
							disabled={!ready}
							class="coral"
							aria-label="Coral paper"
							aria-pressed={accent === 'coral'}
							onclick={() => {
								accent = 'coral';
							}}>{accent === 'coral' ? '✓' : ''}</button
						>
					</div>
				</fieldset>
				<fieldset class="dock-controls">
					<legend>Inspector position</legend>
					<div>
						<button
							disabled={!ready}
							aria-pressed={dock === 'left'}
							onclick={() =>
								layout.update(() => {
									dock = 'left';
								})}>← Left</button
						><button
							disabled={!ready}
							aria-pressed={dock === 'right'}
							onclick={() =>
								layout.update(() => {
									dock = 'right';
								})}>Right →</button
						>
					</div>
				</fieldset>
				<div class="inspector-note">
					<span aria-hidden="true">✳</span>
					<p>A little room to think.<br />Move the tools to suit you.</p>
				</div>
			</aside>
		{/if}
	</div>
</div>

<style>
	.desk {
		border: 1px solid #d3d8c9;
		border-radius: 12px;
		overflow: hidden;
		background: #e8ebdf;
		color: #222720;
	}
	.desk-toolbar {
		background: #fafbf5;
		border-bottom: 1px solid #d3d8c9;
		padding: 20px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.document {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	.document > span {
		font-size: 25px;
		color: #5e6856;
	}
	.document strong,
	.document small {
		display: block;
	}
	.document strong {
		font-size: 13px;
		font-weight: 550;
	}
	.document small {
		font-size: 10px;
		color: #5e6856;
		margin-top: 5px;
	}
	button {
		cursor: pointer;
		font: inherit;
		color: inherit;
	}
	button:disabled {
		cursor: wait;
	}
	.desk-toolbar button {
		background: transparent;
		border: 1px solid #d3d8c9;
		border-radius: 5px;
		padding: 9px 12px;
		font-size: 11px;
	}
	.desk-toolbar button span {
		padding-left: 12px;
	}
	.workspace {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 260px;
		min-height: 610px;
	}
	.workspace.left {
		grid-template-columns: 260px minmax(0, 1fr);
	}
	.workspace.wide {
		grid-template-columns: minmax(0, 1fr);
	}
	.canvas-area {
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24px 36px;
		grid-column: 1;
		grid-row: 1;
	}
	.left .canvas-area {
		grid-column: 2;
	}
	.wide .canvas-area {
		grid-column: 1;
	}
	.canvas-tabs {
		display: flex;
		gap: 3px;
		background: #dce1d2;
		padding: 4px;
		border-radius: 8px;
		margin-bottom: 25px;
	}
	.canvas-tabs button {
		position: relative;
		padding: 8px 22px;
		font-size: 11px;
		border: 0;
		background: transparent;
	}
	.active-tab {
		position: absolute;
		inset: 0;
		border-radius: 5px;
		background: #fafbf5;
		box-shadow: 0 1px 2px #22272010;
	}
	.tab-label {
		position: relative;
	}
	.canvas {
		width: 100%;
		max-width: 520px;
		background: #dbe6bc;
		box-shadow: 0 12px 25px #2227200e;
		display: grid;
		padding: 24px;
		gap: 22px;
		border-radius: 3px;
	}
	.canvas.coral {
		background: #e98e74;
	}
	.paper-top,
	.paper-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font:
			8px ui-monospace,
			monospace;
		letter-spacing: 1px;
	}
	.paper-top {
		border-bottom: 1px solid #22272040;
		padding-bottom: 13px;
	}
	.paper-top span:first-child {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 2px;
	}
	.cover-copy p {
		font:
			7px ui-monospace,
			monospace;
		letter-spacing: 1.5px;
		margin: 0 0 13px;
	}
	.cover-copy h3 {
		font:
			normal clamp(26px, 3.5vw, 43px)/1.04 Georgia,
			serif;
		letter-spacing: -1.3px;
		max-width: 350px;
		margin: 0 0 14px;
		overflow-wrap: anywhere;
	}
	.cover-copy > span {
		font-size: 10px;
	}
	.canvas-image {
		/* Integer 3:2 geometry avoids Safari projection-box rounding changing the crop. */
		aspect-ratio: 3/2;
		width: round(down, 100%, 3px);
		overflow: hidden;
	}
	.canvas-image img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		aspect-ratio: 3/2;
	}
	.paper-bottom {
		padding-top: 0;
		letter-spacing: 0;
	}
	.paper-bottom span:last-child {
		font-size: 19px;
	}
	.canvas.cover {
		max-width: 350px;
		gap: 20px;
	}
	.cover .cover-copy h3 {
		font-size: 39px;
		line-height: 1.08;
	}
	.canvas-status {
		margin-top: 24px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 9px;
		color: #5e6856;
	}
	.canvas-status > span:last-child {
		margin-left: 10px;
	}
	.status-dot {
		height: 5px;
		width: 5px;
		background: #6d7e53;
		border-radius: 50%;
	}
	.inspector {
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
		background: #f6f7ef;
		border-left: 1px solid #d3d8c9;
		padding: 26px 22px;
	}
	.left .inspector {
		grid-column: 1;
		border-left: 0;
		border-right: 1px solid #d3d8c9;
	}
	.inspector-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 24px;
	}
	.inspector h3 {
		font-size: 13px;
		font-weight: 550;
		margin: 0;
	}
	.inspector-title > span {
		font-size: 18px;
		color: #8c977d;
	}
	.inspector label,
	.inspector legend {
		font-size: 10px;
		color: #59624f;
		margin-bottom: 9px;
		display: block;
	}
	.inspector input,
	.inspector textarea {
		width: 100%;
		background: #fff;
		border: 1px solid #d3d8c9;
		border-radius: 4px;
		padding: 10px;
		font:
			11px/1.6 'Instrument Sans Variable',
			sans-serif;
		margin-bottom: 22px;
		color: #222720;
		resize: vertical;
		box-sizing: border-box;
	}
	.inspector fieldset {
		border: 0;
		padding: 0;
		margin: 0 0 25px;
	}
	.swatches {
		display: flex;
		gap: 8px;
	}
	.swatches button {
		height: 32px;
		width: 32px;
		border: 1px solid #22272025;
		border-radius: 50%;
		font-size: 14px;
	}
	.swatches .moss {
		background: #dbe6bc;
	}
	.swatches .coral {
		background: #e98e74;
	}
	.dock-controls > div {
		display: flex;
		border: 1px solid #d3d8c9;
		border-radius: 5px;
		padding: 3px;
		gap: 3px;
	}
	.dock-controls button {
		width: 50%;
		background: none;
		border: 0;
		border-radius: 3px;
		padding: 8px 4px;
		font-size: 10px;
	}
	.dock-controls button[aria-pressed='true'] {
		background: #222720;
		color: #f5f3e9;
	}
	.inspector-note {
		border-top: 1px solid #d3d8c9;
		padding-top: 25px;
		display: flex;
		gap: 12px;
		align-items: center;
		color: #5e6856;
	}
	.inspector-note span {
		font-size: 30px;
		color: #cf4a2a;
	}
	.inspector-note p {
		font-size: 10px;
		line-height: 1.7;
		margin: 0;
	}
	button:focus-visible,
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid #cf4a2a;
		outline-offset: 3px;
	}
	@media (max-width: 800px) {
		.workspace,
		.workspace.left {
			grid-template-columns: minmax(0, 1fr) 225px;
		}
		.left .canvas-area {
			grid-column: 1;
		}
		.left .inspector {
			grid-column: 2;
			border-right: 0;
			border-left: 1px solid #d3d8c9;
		}
		.workspace.wide {
			grid-template-columns: minmax(0, 1fr);
		}
		.canvas-area {
			padding: 24px;
		}
		.canvas {
			padding: 18px;
		}
		.inspector {
			padding: 25px 16px;
		}
		.dock-controls {
			display: none;
		}
	}
	@media (max-width: 580px) {
		.desk-toolbar {
			padding: 17px;
		}
		.document strong {
			font-size: 11px;
		}
		.document small {
			font-size: 9px;
		}
		.desk-toolbar button {
			font-size: 10px;
			padding: 8px;
		}
		.desk-toolbar button span {
			display: none;
		}
		.workspace,
		.workspace.left,
		.workspace.wide {
			grid-template-columns: 1fr;
		}
		.canvas-area,
		.left .canvas-area {
			grid-column: 1;
			grid-row: 1;
			padding: 20px;
		}
		.inspector,
		.left .inspector {
			grid-column: 1;
			grid-row: 2;
			border-left: 0;
			border-top: 1px solid #d3d8c9;
			padding: 24px;
		}
		.canvas {
			max-width: 400px;
		}
		.cover .cover-copy h3 {
			font-size: 34px;
		}
		.cover-copy h3 {
			font-size: 34px;
		}
		.inspector-note {
			display: none;
		}
		.canvas-status {
			font-size: 8px;
		}
	}
</style>
