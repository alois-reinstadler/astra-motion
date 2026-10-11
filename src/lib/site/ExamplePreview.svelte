<script lang="ts">
	import { MotionConfig, useReducedMotion } from '$lib/motion/index.js';
	import { loadExampleComponent } from './example-components.js';
	import type { LiveExample } from './examples.js';
	let { example }: { example: LiveExample } = $props();
	const reduced = useReducedMotion();
	let attempt = $state(0);
	const component = $derived.by(() => {
		void attempt;
		return loadExampleComponent(example.component);
	});
</script>

<MotionConfig reducedMotion="user">
	{#if reduced.current}
		<p class="reduced-notice">
			Motion is reduced by your device preference: transforms settle immediately while fades
			continue.
		</p>
	{/if}
	{#await component}
		<p role="status">Loading interactive preview…</p>
	{:then Component}
		<Component />
	{:catch}
		<p role="alert">The interactive preview could not load.</p>
		<button onclick={() => attempt++}>Retry preview</button>
	{/await}
</MotionConfig>

<style>
	.reduced-notice {
		margin: 0 0 18px;
		padding: 8px 12px;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 5px;
		background: var(--site-panel, #f2f3eb);
		color: var(--site-muted, #67695e);
		font-size: 11px;
		line-height: 1.5;
		text-align: center;
	}
</style>
