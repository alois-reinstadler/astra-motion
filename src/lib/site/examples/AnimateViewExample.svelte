<script lang="ts">
	import { AnimateView, startViewTransition } from '$lib/motion/index.js';
	let expanded = $state(false);
	let status = $state('Open the cover to change views.');
	function changeView() {
		const transition = startViewTransition(
			() => {
				expanded = !expanded;
			},
			{ types: [expanded ? 'back' : 'open'] }
		);
		void transition.finished.then(
			(outcome) => {
				status =
					outcome === 'unsupported'
						? 'View changed. This browser uses the immediate fallback.'
						: 'View changed.';
			},
			() => {
				status = 'The update could not finish.';
			}
		);
	}
</script>

<div class="example">
	<button aria-expanded={expanded} onclick={changeView}
		>{expanded ? 'Back to collection' : 'Open cover'}</button
	>
	<div class="stage">
		{#key expanded}
			<AnimateView
				reducedMotion="user"
				name="field-notes-cover"
				transition={{ duration: 0.35, ease: 'easeInOut' }}
			>
				{#snippet children(view)}
					<article {@attach view} class:expanded class="cover">
						<span>FIELD NOTES / 01</span>
						<h3>{expanded ? 'A closer look.' : 'Small discoveries.'}</h3>
						{#if expanded}<p>
								Different DOM elements share one name, so their snapshots connect across the change.
							</p>{/if}
					</article>
				{/snippet}
			</AnimateView>
		{/key}
	</div>
	<p class="status" aria-live="polite">{status}</p>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 24px;
		width: 100%;
		padding: 28px 16px;
		color: var(--site-ink, #252821);
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 24px;
		padding: 9px 18px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.stage {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 230px;
		width: min(100%, 390px);
	}
	.cover {
		width: 180px;
		min-height: 190px;
		padding: 24px;
		border-radius: 4px;
		background: #dfe5d1;
	}
	.cover.expanded {
		width: 330px;
		min-height: 220px;
		background: #edd1ba;
	}
	span {
		font-size: 9px;
		letter-spacing: 0.13em;
	}
	h3 {
		margin: 32px 0 18px;
		font-size: 28px;
		line-height: 1.1;
		letter-spacing: -0.05em;
		font-weight: 500;
	}
	p {
		margin: 0;
		font-size: 12px;
		line-height: 1.6;
	}
	.status {
		max-width: 320px;
		text-align: center;
		color: var(--site-muted, #67695e);
		font-size: 11px;
	}
</style>
