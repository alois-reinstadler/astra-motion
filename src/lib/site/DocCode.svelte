<script lang="ts">
	import { onMount } from 'svelte';
	let { source, label = 'Example.svelte' }: { source: string; label?: string } = $props();
	let feedback = $state('');
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	async function copy() {
		try {
			await navigator.clipboard.writeText(source);
			feedback = 'Copied to clipboard';
		} catch {
			feedback = 'Select the source to copy it. Clipboard access is unavailable.';
		}
	}
</script>

<div class="code-block">
	<div class="code-header">
		<span>{label}</span><button onclick={copy} disabled={!ready} aria-label={`Copy ${label}`}
			>{feedback === 'Copied to clipboard' ? 'Copied ✓' : 'Copy'}</button
		>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll complete source examples.) -->
	<pre tabindex="0" role="region" aria-label={`${label} source`}><code>{source}</code></pre>
	<p class="copy-feedback" role="status">{feedback}</p>
</div>

<style>
	.code-block {
		margin: 24px 0;
		min-width: 0;
	}
	.code-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 12px 18px;
		border: 1px solid var(--site-line);
		border-bottom: 0;
		background: #e7e9df;
		border-radius: 7px 7px 0 0;
		font-size: 11px;
		color: #545b4b;
	}
	button {
		border: 1px solid #bfc4b5;
		background: #f7f7f0;
		border-radius: 4px;
		padding: 5px 10px;
		cursor: pointer;
		font: inherit;
		color: var(--site-ink);
	}
	button:hover {
		border-color: var(--site-ink);
	}
	pre {
		max-width: 100%;
		overflow: auto;
		margin: 0;
		border: 1px solid var(--site-line);
		background: var(--site-panel);
		color: #374031;
		border-radius: 0 0 7px 7px;
		padding: 23px 22px;
		font:
			12px/1.8 'SFMono-Regular',
			Consolas,
			'Liberation Mono',
			monospace;
		tab-size: 2;
	}
	.copy-feedback {
		min-height: 0;
		color: var(--site-muted);
		font-size: 11px;
		margin: 8px 0 0;
	}
	.copy-feedback:empty {
		display: none;
	}
	:focus-visible {
		outline: 2px solid var(--site-accent);
		outline-offset: 4px;
	}
	@media (max-width: 600px) {
		pre {
			padding: 18px 14px;
			font-size: 11px;
		}
	}
</style>
