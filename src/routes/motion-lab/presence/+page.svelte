<script lang="ts">
	import { resolve } from '$app/paths';
	import CoordinatedPresence from '$lib/motion-lab/CoordinatedPresence.svelte';
	import { Presence, presence } from '$lib/motion/presence-entry.js';
	import { createInView } from '$lib/motion/in-view.svelte.js';
	let mode = $state<'wait' | 'sync'>('wait');
	let chapter = $state(1);
	let completed = $state(0);
	let viewport = $state<HTMLElement>();
	let marker = $state<HTMLElement>();
	const visibility = createInView(
		() => marker,
		() => ({ root: viewport, amount: 'all' })
	);
	let before: CoordinatedPresence;
	let after: CoordinatedPresence;
	const example = `const panel = createMotion({
  initial: 'hidden', animate: 'visible', exit: 'hidden',
  variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  transition: { when: 'afterChildren', staggerChildren: 0.08 }
});
const title = panel.child({ variants: titleVariants });`;
</script>

<svelte:head><title>Coordinated presence · Astra</title></svelte:head>
<main>
	<nav>
		<a href={resolve('/motion-lab')}>Motion lab</a><a href={resolve('/motion-lab/components')}
			>Components</a
		><a href={resolve('/motion-lab/scroll')}>Scroll</a><a href={resolve('/motion-lab/timelines')}
			>Timelines</a
		>
	</nav>
	<p class="eyebrow">Native Svelte retention · Motion trajectories</p>
	<h1>Leave in the right order.</h1>
	<p class="lede">
		Toggle again halfway through an exit. The same real elements reverse from their current pose;
		delayed child targets should never fire afterward.
	</p>
	<div class="examples">
		<article>
			<h2>Children first</h2>
			<p>
				Children stagger out, then the parent fades. Its branch stays alive until the last
				transition completes.
			</p>
			<div class="buttons">
				<button onclick={() => after.toggle()}>Toggle children first</button><button
					onclick={() => after.reduce()}>Reduce motion</button
				>
			</div>
			<div class="stage"><CoordinatedPresence bind:this={after} /></div>
		</article>
		<article>
			<h2>Parent first</h2>
			<p>
				The parent fades, then each child exits. Toggle quickly to test interruption during either
				phase.
			</p>
			<div class="buttons">
				<button onclick={() => before.toggle()}>Toggle parent first</button><button
					onclick={() => before.reduce()}>Reduce motion</button
				>
			</div>
			<div class="stage"><CoordinatedPresence bind:this={before} when="beforeChildren" /></div>
		</article>
		<article data-testid="presence-replacement">
			<h2>Wait or overlap</h2>
			<p>
				Switch chapters during an exit. Completion counts advance after every outgoing branch
				finishes.
			</p>
			<div class="buttons">
				<button onclick={() => chapter++}>Next chapter</button>
				<button
					aria-pressed={mode === 'sync'}
					onclick={() => (mode = mode === 'wait' ? 'sync' : 'wait')}
				>
					{mode === 'wait' ? 'Use sync' : 'Use wait'}
				</button>
			</div>
			<div class="stage">
				<Presence value={chapter} {mode} onExitComplete={() => completed++}>
					{#snippet children(current)}
						<p data-testid="presence-chapter" transition:presence={{ duration: 600 }}>
							Chapter {current}
						</p>
					{/snippet}
				</Presence>
			</div>
			<p data-testid="presence-completed">Completed exits: {completed}</p>
		</article>
		<article>
			<h2>Observe visibility</h2>
			<p>
				Scroll inside this panel. Visibility becomes true when the marker is fully inside its scroll
				container.
			</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll this panel.) -->
			<div
				class="stage viewport"
				bind:this={viewport}
				tabindex="0"
				role="region"
				aria-label="Visibility demo"
			>
				<div class="spacer"></div>
				<p bind:this={marker}>Viewport marker</p>
				<div class="spacer"></div>
			</div>
			<p data-testid="viewport-visible">Fully visible: {visibility.current ? 'yes' : 'no'}</p>
		</article>
	</div>
	<pre><code>{example}</code></pre>
</main>

<style>
	main {
		max-width: 1060px;
		margin: auto;
		padding: 36px 24px 80px;
		color: #e9edf2;
	}
	:global(body) {
		background: #111519;
	}
	nav,
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	nav a {
		color: #a4bdce;
		font-size: 13px;
	}
	.eyebrow {
		margin-top: 64px;
		color: #89c5b4;
		font-size: 12px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	h1 {
		font-size: clamp(36px, 6vw, 64px);
		line-height: 1.05;
		letter-spacing: -0.04em;
		margin: 12px 0 24px;
	}
	.lede {
		max-width: 680px;
		color: #a8b1b9;
		line-height: 1.7;
	}
	.examples {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
		margin: 40px 0;
	}
	article {
		border-top: 1px solid #38424a;
		padding-top: 24px;
	}
	h2 {
		font-size: 22px;
	}
	article > p {
		min-height: 70px;
		color: #a8b1b9;
		line-height: 1.6;
	}
	button {
		cursor: pointer;
		background: #d0ecdf;
		color: #16251d;
		padding: 10px 14px;
		border-radius: 6px;
		font-size: 13px;
	}
	.stage {
		min-height: 230px;
		margin-top: 20px;
		padding: 16px;
		background: #1b242b;
		border-radius: 12px;
		overflow: hidden;
	}
	.stage :global(section) {
		background: #ddece4;
		color: #213229;
		border-radius: 8px;
		max-width: 100%;
	}
	.viewport {
		height: 230px;
		overflow: auto;
	}
	.spacer {
		height: 240px;
	}
	.stage :global(p) {
		color: #213229;
		padding: 10px;
		margin: 8px 0;
		background: #c0d7cb;
		border-radius: 4px;
	}
	pre {
		overflow: auto;
		font-size: 12px;
		line-height: 1.7;
		padding: 24px;
		background: #192027;
		border-radius: 8px;
	}
	@media (max-width: 680px) {
		.examples {
			grid-template-columns: 1fr;
		}
	}
</style>
