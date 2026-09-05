<script lang="ts">
	import { flushSync, onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { MotionConfig } from '$lib/motion/index.js';
	import DocCode from './DocCode.svelte';
	import type { LiveExample } from './examples.js';
	let { example }: { example: LiveExample } = $props();
	let revision = $state(0);
	let ready = $state(false);
	let leaving = $state(false);
	// A demo's global native exits should not retain the surrounding guide on navigation.
	onNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname) return;
		flushSync(() => {
			leaving = true;
		});
		return () => {
			leaving = false;
		};
	});
	onMount(() => {
		ready = true;
	});
</script>

<div class="example" data-example={example.id}>
	<div class="preview-heading">
		<span><i aria-hidden="true"></i> Live preview</span>
		<button onclick={() => revision++} disabled={!ready} aria-label={`Reset ${example.title}`}>
			<span aria-hidden="true">↺</span> Reset
		</button>
	</div>
	<fieldset class="preview" aria-label={example.title} disabled={!ready}>
		<MotionConfig reducedMotion={leaving ? 'always' : 'user'}>
			{#key revision}
				<example.component />
			{/key}
		</MotionConfig>
	</fieldset>
	<details>
		<summary><span>View code</span><span class="filename">{example.filename}</span></summary>
		<DocCode source={example.source} label={example.filename} />
	</details>
</div>

<style>
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
		font-family: monospace;
		color: var(--site-muted);
		font-size: 16px;
	}
	details[open] summary::before {
		content: '−';
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
	details :global(.copy-feedback:not(:empty)) {
		padding: 0 18px 10px;
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
