<script lang="ts">
	import { LazyMotion } from '$lib/motion/lazy-entry.js';
	import * as m from '$lib/motion/m/index.js';
	let loaded = $state(false);
	let requested = $state(false);
	let moved = $state(false);
	let note = $state('Native input stays ready');
	let release: () => void;
	const requestedFeatures = new Promise<void>((resolve) => {
		release = resolve;
	});
	const loadFeatures = async () => {
		await requestedFeatures;
		const { domAnimation } = await import('$lib/motion/dom-animation.js');
		loaded = true;
		return domAnimation;
	};
</script>

<div class="example">
	<svelte:boundary>
		<LazyMotion features={loadFeatures} strict>
			<div class="stage">
				<m.div
					class="tile"
					aria-hidden="true"
					initial={{ x: -65, opacity: 0.5 }}
					animate={{ x: moved ? 65 : 0, opacity: 1 }}
					transition={{ duration: 0.3 }}
				/>
			</div>
			<label>Keep a draft <m.input bind:value={note} /></label>
		</LazyMotion>
		{#snippet failed()}
			<p role="alert">The feature module could not load. Reset this example to try again.</p>
		{/snippet}
	</svelte:boundary>
	<div class="controls">
		<button
			disabled={requested}
			onclick={() => {
				requested = true;
				release();
			}}>Load animation</button
		>
		<button aria-pressed={moved} onclick={() => (moved = !moved)}>Change pending target</button>
	</div>
	<p class="status" aria-live="polite">
		{loaded ? 'Animation features loaded' : 'Native content ready; animation features pending'}
	</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 16px;
		width: 100%;
		padding: 22px 16px;
		color: var(--site-ink, #252821);
	}
	.stage {
		display: grid;
		place-items: center;
		width: 260px;
		min-height: 120px;
	}
	.example :global(.tile) {
		width: 52px;
		height: 52px;
		border-radius: 14px;
		background: var(--site-accent, #d34123);
	}
	label {
		display: grid;
		gap: 8px;
		font-size: 12px;
		width: min(100%, 280px);
	}
	.example :global(input) {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 6px;
		padding: 10px;
		background: var(--site-bg, #f7f7f0);
		color: inherit;
		width: 100%;
	}
	.controls {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		padding: 9px 16px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
	button:focus-visible,
	.example :global(input:focus-visible) {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.status {
		font-size: 11px;
		color: var(--site-muted, #64695c);
		text-align: center;
		margin: 0;
	}
</style>
