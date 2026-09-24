<script lang="ts">
	import DocCode from '$lib/site/DocCode.svelte';
	let { files }: { files: { name: string; source: string }[] } = $props();
	let expanded = $state(false);
</script>

<details class="source-viewer" bind:open={expanded}>
	<summary>Read the working source </summary>
	{#if expanded}
		<div class="source-body">
			<p>
				These are the actual files running above. Keep companion files together; <code
					>$lib/motion</code
				>
				refers to this repository’s runtime. The page wraps every scene in <code>MotionConfig</code> to
				inherit the motion preference.
			</p>
			{#each files as file (file.name)}<DocCode label={file.name} source={file.source} />{/each}
		</div>
	{/if}
	<noscript>
		<div class="source-body">
			{#each files as file (file.name)}
				<h4>{file.name}</h4>
				<pre>{file.source}</pre>
			{/each}
		</div>
	</noscript>
</details>

<style>
	.source-body pre {
		max-height: 500px;
		overflow: auto;
		font-size: 12px;
	}

	.source-viewer[open] .source-body {
		animation: source-reveal 200ms ease-out;
	}
	@keyframes source-reveal {
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
		.source-viewer[open] .source-body {
			animation: none;
		}
	}

	.source-viewer {
		margin-top: 18px;
		border: 1px solid #d3d8c9;
		border-radius: 7px;
		background: #fafbf5;
	}
	.source-viewer summary {
		cursor: pointer;
		padding: 16px 20px;
		font-size: 12px;
		color: #4b5643;
	}

	.source-viewer summary:focus-visible {
		outline: 2px solid #cf4a2a;
		outline-offset: 3px;
	}
	.source-body {
		padding: 0 20px 20px;
		min-width: 0;
	}
	.source-body p {
		font-size: 12px;
		line-height: 1.8;
		color: #707869;
		max-width: 720px;
		margin: 8px 0 24px;
	}
	.source-body code {
		font-size: 11px;
		color: #4b5643;
	}
</style>
