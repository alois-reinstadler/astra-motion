<script lang="ts">
	import { onDestroy } from 'svelte';
	import { AnimateView, startViewTransition } from '$lib/motion/index.js';

	const instance = $props.id();
	const stories = [
		{
			id: 'coast',
			title: 'Coastal light',
			place: 'The Atlantic coast',
			number: '01',
			color: '#d5ded3',
			ink: '#64858a',
			text: 'Follow the edge of the water. A quiet collection of small places, shifting tides, and afternoons with nowhere else to be.'
		},
		{
			id: 'river',
			title: 'River paths',
			place: 'The northern wetlands',
			number: '02',
			color: '#e8d7bb',
			ink: '#797b54',
			text: 'Every river finds its own way. Trace the bends, islands, and slow journeys that turn a familiar landscape into something new.'
		},
		{
			id: 'dunes',
			title: 'Desert lines',
			place: 'The western dunes',
			number: '03',
			color: '#e4c5ae',
			ink: '#b66e4e',
			text: 'Watch the wind draw a new horizon. These notes collect the shapes and long shadows that disappear with the next morning.'
		}
	];
	type Story = (typeof stories)[number];
	const timing = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };
	let selected = $state<Story | null>(null);
	let status = $state('Choose a field note to explore.');
	let root: HTMLDivElement | undefined;
	let generation = 0;
	function attachRoot(node: HTMLDivElement) {
		root = node;
		return () => {
			root = undefined;
		};
	}

	function changeView(next: Story | null) {
		const current = ++generation;
		const returnId = selected?.id;
		const transition = startViewTransition(
			() => {
				selected = next;
			},
			{
				types: [next ? 'open' : 'back']
			}
		);
		void transition.finished.then(
			(outcome) => {
				if (current !== generation) return;
				status =
					outcome === 'unsupported'
						? 'View changed. This browser uses the immediate fallback.'
						: next
							? `Viewing ${next.title}.`
							: 'Back to the field notes.';
				const target = next ? '[data-view-back]' : `[data-view-open="${returnId}"]`;
				root?.querySelector<HTMLButtonElement>(target)?.focus({ preventScroll: true });
			},
			() => {
				if (current === generation) status = 'The update could not finish.';
			}
		);
	}
	onDestroy(() => {
		generation++;
	});
</script>

{#snippet artwork(story: Story)}
	<AnimateView name={`${instance}-${story.id}-art`} reducedMotion="user" transition={timing}>
		{#snippet children(view)}
			<span
				{@attach view}
				class="artwork"
				style={`--paper:${story.color};--ink:${story.ink};`}
				data-shared-art={story.id}
			>
				<svg viewBox="0 0 360 225" aria-hidden="true" focusable="false">
					<rect width="360" height="225" fill="var(--paper)" />
					<circle cx="270" cy="56" r="29" fill="#fff8e8" />
					{#if story.id === 'coast'}
						<path d="M0 140 Q100 80 190 148 T360 135 V225 H0Z" fill="var(--ink)" />
						<path
							d="M0 181 Q120 139 215 183 T360 168"
							fill="none"
							stroke="#f6eee0"
							stroke-width="3"
						/>
						<path
							d="M0 204 Q120 161 230 206 T360 189"
							fill="none"
							stroke="#f6eee0"
							stroke-width="2"
						/>
					{:else if story.id === 'river'}
						<path d="M0 85 Q95 150 170 80 T360 93 V225 H0Z" fill="var(--ink)" />
						<path
							d="M195 70 C110 102 279 120 175 156 S83 184 215 239"
							fill="none"
							stroke="#d9e2d9"
							stroke-width="27"
						/>
					{:else}
						<path d="M0 185 Q115 42 220 136 T360 104 V225 H0Z" fill="var(--ink)" />
						<path d="M0 218 Q150 105 250 182 T360 167 V225 H0Z" fill="#d49b71" />
						<path d="M0 185 Q115 42 220 136" fill="none" stroke="#f8dfb5" stroke-width="2" />
					{/if}
				</svg>
			</span>
		{/snippet}
	</AnimateView>
{/snippet}

{#snippet title(story: Story)}
	<AnimateView name={`${instance}-${story.id}-title`} reducedMotion="user" transition={timing}>
		{#snippet children(view)}
			<span {@attach view} class="story-title" data-shared-title={story.id}>{story.title}</span>
		{/snippet}
	</AnimateView>
{/snippet}

<div class="example" {@attach attachRoot}>
	<div class="stage">
		{#if selected}
			{@const story = selected}
			<article class="detail" data-view-detail={story.id}>
				<button class="back" data-view-back onclick={() => changeView(null)}
					>← Back to collection</button
				>
				{@render artwork(story)}
				<h3 class="detail-heading">{@render title(story)}</h3>
				<AnimateView
					name={`${instance}-${story.id}-body`}
					reducedMotion="user"
					enter={{ opacity: [0, 1] }}
					exit={{ opacity: [1, 0] }}
					transition={{ duration: 0.2 }}
				>
					{#snippet children(view)}
						<div {@attach view} class="description">
							<p class="eyebrow">FIELD NOTES / {story.number} / {story.place}</p>
							<p>{story.text}</p>
							<div class="reading">
								<span>6 minute read</span><span>Take the scenic route.</span>
							</div>
						</div>
					{/snippet}
				</AnimateView>
			</article>
		{:else}
			<div class="collection-heading">
				<span class="eyebrow">FIELD NOTES</span><span>Three places to pause.</span>
			</div>
			<div class="collection">
				{#each stories as story (story.id)}
					<button
						class="story-card"
						data-view-open={story.id}
						aria-label={`Open ${story.title}`}
						onclick={() => changeView(story)}
					>
						{@render artwork(story)}
						<span class="eyebrow">{story.number} / JOURNAL</span>
						{@render title(story)}
						<span class="explore">Explore the note <span aria-hidden="true">↗</span></span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
	<p class="status" aria-live="polite">{status}</p>
</div>

<style>
	.example {
		width: 100%;
		padding: 16px 0;
		color: var(--site-ink, #252821);
	}
	.stage {
		width: 100%;
		max-width: 660px;
		min-height: 415px;
		margin: auto;
	}
	.collection-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin: 0 0 20px;
		font-size: 11px;
		color: var(--site-muted, #67695e);
	}
	.collection {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px;
	}
	button {
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 5px;
	}
	.story-card {
		min-width: 0;
		padding: 0;
		border: 0;
		background: transparent;
		text-align: left;
	}
	.artwork {
		display: block;
		width: 100%;
		aspect-ratio: 8 / 5;
		overflow: hidden;
		border-radius: 8px;
		background: var(--paper);
	}
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.eyebrow {
		display: block;
		font-size: 9px;
		line-height: 1.6;
		letter-spacing: 0.08em;
	}
	.story-card > .eyebrow {
		margin-top: 15px;
		color: var(--site-muted, #67695e);
	}
	.story-title {
		display: block;
		width: fit-content;
		max-width: 100%;
		margin: 8px 0 13px;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.15;
		letter-spacing: -0.04em;
		text-align: left;
	}
	.explore {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		color: var(--site-muted, #67695e);
		font-size: 10px;
	}
	.detail {
		max-width: 520px;
		margin: auto;
	}
	.back {
		display: block;
		margin: 0 0 18px;
		padding: 6px 0;
		border: 0;
		background: transparent;
		font-size: 12px;
	}
	.detail-heading {
		margin: 22px 0 16px;
		font: inherit;
	}
	.detail-heading .story-title {
		margin: 0;
	}
	.description p {
		margin: 0 0 14px;
		font-size: 13px;
		line-height: 1.7;
		color: var(--site-muted, #67695e);
	}
	.description .eyebrow {
		font-size: 9px;
	}
	.reading {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		border-top: 1px solid var(--site-line, #d8d8cc);
		padding-top: 14px;
		font-size: 10px;
		color: var(--site-muted, #67695e);
	}
	.status {
		max-width: 420px;
		margin: 24px auto 0;
		text-align: center;
		color: var(--site-muted, #67695e);
		font-size: 11px;
		line-height: 1.6;
	}
	@media (max-width: 540px) {
		.collection {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 24px 14px;
		}
		.collection-heading {
			align-items: start;
		}
		.story-title {
			font-size: 18px;
		}
	}
</style>
