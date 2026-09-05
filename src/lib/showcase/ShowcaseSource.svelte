<script lang="ts">
	import DocCode from '$lib/site/DocCode.svelte';
	let { files }: { files: { name: string; source: string }[] } = $props();
</script>

<details class="source-viewer">
	<summary>Read the working source <span aria-hidden="true">↗</span></summary>
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
</details>

<style>
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
	.source-viewer summary span {
		float: right;
		color: #cf4a2a;
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
