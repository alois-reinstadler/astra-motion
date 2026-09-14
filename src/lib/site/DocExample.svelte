<script lang="ts">
	import { getAllContexts, mount, onMount, unmount } from 'svelte';
	import ExamplePreview from './ExamplePreview.svelte';
	import DocCode from './DocCode.svelte';
	import type { LiveExample } from './examples.js';
	let { example }: { example: LiveExample } = $props();
	let revision = $state(0);
	let ready = $state(false);
	let sourceOpen = $state(false);
	const context = getAllContexts();
	function preview(node: HTMLElement) {
		// A separate Svelte root keeps a demo's global outros inside its preview.
		// Navigation and Reset dispose it immediately, even during an active exit.
		const instance = mount(ExamplePreview, { target: node, props: { example }, context });
		return () => {
			void unmount(instance, { outro: false });
		};
	}
	onMount(() => {
		ready = true;
	});
</script>

<div class="example" data-example={example.id}>
	<div class="preview-heading">
		<span><i aria-hidden="true"></i> Live preview</span>
		<button
			data-ui-control
			onclick={() => revision++}
			disabled={!ready}
			aria-label={`Reset ${example.title}`}
		>
			{#key revision}<span class:replaying={revision > 0} aria-hidden="true">↺</span>{/key} Reset
		</button>
	</div>
	<fieldset class="preview" aria-label={example.title} disabled={!ready}>
		{#if ready}
			{#key `${example.id}:${revision}`}
				<div class="preview-root" {@attach preview}></div>
			{/key}
		{:else}
			<p class="preview-placeholder">
				Interactive preview · Enable JavaScript to try it. Full source below.
			</p>
		{/if}
	</fieldset>
	<details
		{@attach (node) => {
			sourceOpen = node.open;
		}}
		ontoggle={(event) => (sourceOpen = event.currentTarget.open)}
	>
		<summary><span>View code</span><span class="filename">{example.filename}</span></summary>
		{#if sourceOpen}
			<DocCode source={example.source} label={example.filename} />
		{/if}
		<noscript>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the source without JavaScript.) -->
			<pre role="region" aria-label={`${example.filename} source`} tabindex="0"><code
					>{example.source}</code
				></pre>
		</noscript>
	</details>
</div>

<style>
	.replaying {
		animation: reset-turn 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes reset-turn {
		from {
			transform: rotate(0);
		}
		to {
			transform: rotate(-360deg);
		}
	}
	summary:hover::before {
		color: var(--site-accent);
	}
	details[open] :global(.code-block) {
		animation: source-enter 200ms ease-out;
	}
	@keyframes source-enter {
		from {
			opacity: 0;
			translate: 0 5px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.replaying,
		details[open] :global(.code-block) {
			animation: none;
		}
		summary::before {
			transition: none;
		}
	}

	.example {
		margin: 24px 0 18px;
		border: 1px solid var(--site-line);
		border-radius: 10px;
		overflow: hidden;
		min-width: 0;
	}
	.preview-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 13px 20px;
		background: #f2f3eb;
		border-bottom: 1px solid var(--site-line);
		font-size: 11px;
	}
	.preview-heading > span {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #64695c;
	}
	i {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #738064;
	}
	button {
		display: flex;
		gap: 6px;
		align-items: center;
		background: transparent;
		border: 0;
		padding: 3px;
		color: #64695c;
		font: inherit;
		cursor: pointer;
	}
	button:hover {
		color: var(--site-accent);
	}
	button:disabled {
		cursor: default;
		opacity: 0.5;
	}
	button span {
		font-size: 16px;
		line-height: 1;
	}
	.preview {
		margin: 0;
		border: 0;
		min-width: 0;
		padding: 32px 24px;
		min-height: 300px;
		display: grid;
		align-items: center;
		background-color: #edeee5;
		background-image: radial-gradient(#c5c9ba 0.65px, transparent 0.65px);
		background-size: 16px 16px;
	}
	.preview-root {
		min-width: 0;
	}
	.preview-placeholder {
		color: var(--site-muted);
		font-size: 13px;
		text-align: center;
	}
	.example[data-example='scroll'] .preview {
		padding: 0;
	}
	details {
		background: var(--site-bg);
		border-top: 1px solid var(--site-line);
	}
	summary {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px 20px;
		cursor: pointer;
		font-size: 12px;
		color: var(--site-ink);
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary::before {
		content: '+';
		transition:
			transform 200ms ease,
			color 160ms;
		font-family: monospace;
		color: var(--site-muted);
		font-size: 16px;
	}
	details[open] summary::before {
		transform: rotate(45deg);
	}
	.filename {
		margin-left: auto;
		color: var(--site-muted);
		font:
			10px ui-monospace,
			monospace;
	}
	details :global(.code-block) {
		margin: 0;
	}
	details :global(.code-header),
	details :global(pre) {
		border-inline: 0;
		border-radius: 0;
	}
	details :global(pre) {
		border-bottom: 0;
		max-height: 480px;
	}
	details :global(.copy-feedback.copy-error) {
		padding: 0 18px 10px;
	}
	noscript pre {
		margin: 0;
		padding: 18px;
		overflow: auto;
		font-size: 12px;
		line-height: 1.65;
	}
	@media (max-width: 600px) {
		.preview {
			padding: 26px 14px;
		}
		.preview-heading,
		summary {
			padding-inline: 14px;
		}
		.filename {
			font-size: 9px;
		}
	}
</style>
