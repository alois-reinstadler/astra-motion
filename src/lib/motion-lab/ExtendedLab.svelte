<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import { createLayout, presence, Presence } from '../motion/index.js';
	import ReflowCards from './ReflowCards.svelte';
	const layout = createLayout({ transition: { type: 'spring', stiffness: 350, damping: 32 } });
	const reduced = createLayout({ reducedMotion: 'always' });
	let dashboard = $state<HTMLDivElement>();
	let sidebar = $state(false);
	let dense = $state(false);
	let text = $state('A small collection of notes on form, movement, and ordinary things.');
	let width = $state(100);
	let loading = $state(false);
	let loaded = $state(false);
	let loadTimer: ReturnType<typeof setTimeout> | undefined;
	let selected = $state(0);
	let wide = $state(false);
	let chapter = $state(0);
	let waitVisible = $state(true);
	let moved = $state(false);
	let stressStep = $state(0);
	let stressing = $state(false);
	let stressTimer: ReturnType<typeof setTimeout> | undefined;
	const shelves = ['Copper', 'Linen', 'Stone', 'Paper', 'Glass'];
	function requestContent() {
		clearTimeout(loadTimer);
		loading = true;
		loaded = false;
		loadTimer = setTimeout(() => {
			loading = false;
			loaded = true;
		}, 650);
	}
	function cancelContent() {
		clearTimeout(loadTimer);
		loading = loaded = false;
	}
	function stopStress() {
		clearTimeout(stressTimer);
		stressing = false;
	}
	function runStress() {
		stopStress();
		stressStep = 0;
		stressing = true;
		const step = () => {
			if (!stressing) return;
			stressStep++;
			sidebar = !sidebar;
			dense = !dense;
			selected = (selected + 1) % shelves.length;
			wide = !wide;
			moved = !moved;
			chapter++;
			if (stressStep < 20) stressTimer = setTimeout(step, 80);
			else stressing = false;
		};
		step();
	}
	onDestroy(() => {
		clearTimeout(loadTimer);
		stopStress();
	});
</script>

<svelte:head><title>Astra / More motion experiments</title></svelte:head>

<main>
	<header>
		<a class="brand" href={resolve('/motion-lab')}>astra<span>®</span></a><span class="eyebrow"
			>ENGINEERING / 002</span
		>
	</header>
	<div class="intro">
		<p class="eyebrow">THE MOTION LABORATORY / EXTENDED</p>
		<h1>Push it.<br /><em>Change your mind.</em></h1>
		<p class="lede">
			More places for motion to go wrong. Interrupt it, change the content, scroll halfway through.
			Every example uses ordinary Svelte state assignments.
		</p>
		<nav>
			<a href={resolve('/motion-lab')}>Original experiments </a><a
				href={resolve('/motion-lab/updates')}
				>Compare update modes
			</a><a href={resolve('/motion-lab/product')}>Route transitions </a>
		</nav>
	</div>
	<div class="stress-bar">
		<div>
			<strong>Try everything at once.</strong>
			<p>Twenty changes, 80 ms apart. The final state should settle without stale motion.</p>
		</div>
		<button data-extra="stress" onclick={runStress} disabled={stressing}>Run 20 changes</button>
		<button onclick={stopStress} disabled={!stressing}>Stop</button><output
			data-extra="stress-count"
			aria-live="off">{stressStep} / 20</output
		>
	</div>
	<nav class="index" aria-label="Experiments">
		<a href="#dashboard">08 / Reflow</a><a href="#content">09 / Content</a><a href="#scroll"
			>10 / Shared scroll</a
		><a href="#distortion">11 / Text</a><a href="#wait">12 / Nested exits</a><a href="#policy"
			>13 / Reduced motion</a
		>
	</nav>

	<section id="dashboard">
		<div class="caption">
			<span>08 / CROSS-COMPONENT REFLOW</span>
			<h2>A neighbor<br />changes shape.</h2>
			<p>
				The sidebar and cards live in different components with different layout controllers. Open
				the sidebar while switching the card density.
			</p>
			<button data-extra="sidebar" onclick={() => (sidebar = !sidebar)}>Toggle sidebar</button
			><button data-extra="density" onclick={() => (dense = !dense)}>Change density</button>
			<p class="watch">
				Watch: card text should stay readable as the available width changes. New line breaks happen
				immediately.
			</p>
		</div>
		<div
			class="stage dashboard"
			{@attach (node) => {
				dashboard = node;
				return () => {
					dashboard = undefined;
				};
			}}
		>
			<aside class:expanded={sidebar} {@attach layout()}>
				<span {@attach layout({ mode: 'position' })}>{sidebar ? 'Index' : 'i'}</span>
			</aside>
			<ReflowCards {dense} observationRoot={() => dashboard} />
		</div>
	</section>

	<section id="content">
		<div class="caption">
			<span>09 / INTRINSIC SIZE & DELAYED CONTENT</span>
			<h2>Nothing has<br />a fixed height.</h2>
			<p>
				Edit the copy, change the available width, or load another paragraph after 650 ms. Cancel
				before it arrives.
			</p>
			<label
				>Available width <input
					data-extra="width"
					type="range"
					min="60"
					max="100"
					bind:value={width}
				/></label
			><label>Live copy <textarea data-extra="copy" rows="3" bind:value={text}></textarea></label
			><button data-extra="load" onclick={requestContent}>Load content</button><button
				data-extra="cancel-load"
				onclick={cancelContent}>Cancel / clear</button
			>
			<p class="watch">
				Watch: the following receipt should follow the card. Resizing this container is separate
				from resizing the browser window.
			</p>
		</div>
		<div class="stage content-stage">
			<div class="content-stack" style:width={`${width}%`}>
				<article class="note" data-extra="note" {@attach layout({ style: { borderRadius: 10 } })}>
					<h3 {@attach layout({ mode: 'position' })}>Notes in motion</h3>
					<p class="live-copy" {@attach layout({ mode: 'position' })}>
						{text || 'Write something in the field.'}
					</p>
					{#if loaded}<p data-extra="loaded" {@attach layout({ mode: 'position' })}>
							The new paragraph arrived asynchronously. CSS decides the height, and the next item
							follows. Try narrowing this card before the request completes.
						</p>{/if}
				</article>
				<div class="receipt" data-extra="receipt" {@attach layout()}>
					<span {@attach layout({ mode: 'position' })}
						>{loading
							? 'Waiting for content…'
							: loaded
								? 'Content received.'
								: 'Ready for another change.'}</span
					>
				</div>
			</div>
		</div>
	</section>

	<section id="scroll">
		<div class="caption">
			<span>10 / SHARED ID INSIDE A SCROLLER</span>
			<h2>Follow the<br />selected object.</h2>
			<p>
				Select different shelves, then scroll while the marker is moving. The same shared ID moves
				between five different buttons.
			</p>
			<button data-extra="next-shelf" onclick={() => (selected = (selected + 1) % shelves.length)}
				>Next shelf</button
			>
			<p class="watch">
				Watch: the coral marker should land on the selected label without an extra jump caused by
				scrolling. Use the horizontal scrollbar to follow it.
			</p>
		</div>
		<div class="stage shelf-stage">
			<div class="scroller" data-extra="scroller" {@attach layout({ scroll: true })}>
				<div class="shelves">
					{#each shelves as name, i (name)}<button
							class="shelf"
							class:selected={selected === i}
							data-extra={`shelf-${i}`}
							aria-pressed={selected === i}
							onclick={() => (selected = i)}
							><span class="shelf-number">0{i + 1}</span><span>{name}</span
							>{#if selected === i}<span
									class="marker"
									data-extra="shelf-marker"
									{@attach layout({ id: 'shelf-marker', style: { borderRadius: 6 } })}
								></span>{/if}</button
						>{/each}
				</div>
			</div>
		</div>
	</section>

	<section id="distortion">
		<div class="caption">
			<span>11 / CONTENT CORRECTION, SIDE BY SIDE</span>
			<h2>Same surface.<br />Different text.</h2>
			<p>
				The left example intentionally leaves its text unregistered. The right gives the content its
				own position projection.
			</p>
			<button data-extra="resize-text" onclick={() => (wide = !wide)}>Resize both</button>
			<p class="watch">
				Watch: the left stretches during resizing. The right should preserve letter proportions.
				This comparison makes the authoring requirement visible.
			</p>
			<details>
				<summary>Show the correction</summary>
				<pre>&lt;div &#123;@attach layout()&#125;&gt;
  &lt;p &#123;@attach layout(&#123; mode: 'position' &#125;)&#125;&gt;
    Readable text
  &lt;/p&gt;
&lt;/div&gt;</pre>
			</details>
		</div>
		<div class="stage comparison">
			<div>
				<small>UNREGISTERED / INTENTIONAL DISTORTION</small>
				<article class="text-surface" class:wide data-extra="raw-surface" {@attach layout()}>
					<p>Letters<br />keep their shape?</p>
				</article>
			</div>
			<div>
				<small>POSITION-PROJECTED CONTENT</small>
				<article class="text-surface" class:wide {@attach layout()}>
					<p data-extra="corrected-copy" {@attach layout({ mode: 'position' })}>
						Letters<br />keep their shape.
					</p>
				</article>
			</div>
		</div>
	</section>

	<section id="wait">
		<div class="caption">
			<span>12 / NESTED OUTROS & DESTRUCTION</span>
			<h2>The last child<br />closes the door.</h2>
			<p>
				The surface fades in 120 ms; its child takes 650 ms. The next chapter waits for both.
				Request another chapter, reverse, or remove the whole owner during exit.
			</p>
			<button data-extra="next-chapter" onclick={() => chapter++}>Next chapter</button><button
				data-extra="previous-chapter"
				onclick={() => (chapter = Math.max(0, chapter - 1))}>Previous</button
			><button data-extra="destroy-wait" onclick={() => (waitVisible = !waitVisible)}
				>{waitVisible ? 'Remove owner' : 'Restore owner'}</button
			>
			<p class="watch">
				Requested: {chapter + 1}. Only the latest requested chapter should appear after the outgoing
				child finishes.
			</p>
		</div>
		<div class="stage wait-stage">
			{#if waitVisible}<Presence value={chapter}
					>{#snippet children(value)}<article
							class="wait-card"
							data-extra="wait-card"
							transition:presence={{ duration: 120 }}
						>
							<small>CHAPTER {value + 1}</small><strong
								data-extra="wait-child"
								transition:presence={{ duration: 650 }}>{String(value + 1).padStart(2, '0')}</strong
							>
						</article>{/snippet}</Presence
				>{:else}<p class="empty">Owner removed. Restore it to start fresh.</p>{/if}
		</div>
	</section>

	<section id="policy">
		<div class="caption">
			<span>13 / REDUCED MOTION</span>
			<h2>Same state.<br />Different policy.</h2>
			<p>
				The upper lane follows your device preference. The lower lane always disables layout
				animation. Both receive the same state change.
			</p>
			<button data-extra="policy-move" onclick={() => (moved = !moved)}>Move both</button>
			<p class="watch">
				With reduced motion enabled on your device, both should settle immediately. Otherwise only
				the lower lane should snap.
			</p>
		</div>
		<div class="stage policies">
			<small>DEVICE PREFERENCE</small>
			<div class="policy-rail" class:moved>
				<div class="policy-dot" data-extra="user-policy" {@attach layout()}></div>
			</div>
			<small>ALWAYS REDUCED</small>
			<div class="policy-rail" class:moved>
				<div class="policy-dot reduced" data-extra="reduced-policy" {@attach reduced()}></div>
			</div>
		</div>
	</section>
	<footer>
		<strong>ASTRA MOTION</strong><a href={resolve('/motion-lab/updates')}
			>What does layout.update change?
		</a>
	</footer>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f4f2eb;
		color: #252b21;
	}
	main {
		max-width: 1240px;
		margin: auto;
		padding: 0 48px;
	}
	header,
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 32px 0;
	}
	header {
		border-bottom: 1px solid #cbcfc3;
	}
	a {
		color: inherit;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	.brand {
		font-size: 32px;
		font-weight: 750;
		letter-spacing: -2px;
	}
	.brand span {
		font-size: 12px;
		vertical-align: top;
		margin-left: 5px;
	}
	.eyebrow,
	.caption > span,
	small,
	footer strong,
	.index,
	output {
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1px;
	}
	.intro {
		padding: 64px 0 42px;
	}
	h1 {
		font-size: clamp(56px, 7vw, 88px);
		line-height: 0.98;
		letter-spacing: -4px;
		font-weight: 500;
		margin: 24px 0;
	}
	h1 em {
		font-family: Georgia, serif;
		font-weight: 400;
	}
	.lede {
		max-width: 510px;
		line-height: 1.7;
		color: #697160;
	}
	nav {
		display: flex;
		gap: 24px;
		flex-wrap: wrap;
		font-size: 12px;
		margin-top: 24px;
	}
	.stress-bar {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 22px;
		background: #353c2d;
		color: #f4f2eb;
		border-radius: 6px;
	}
	.stress-bar > div {
		flex: 1;
	}
	.stress-bar p {
		font-size: 12px;
		margin: 8px 0 0;
		opacity: 0.8;
	}
	.stress-bar button:hover {
		background: #4c5542;
	}
	.index {
		padding: 4px 0 24px;
		border-bottom: 1px solid #cbcfc3;
		color: #6c735f;
	}
	section {
		display: grid;
		grid-template-columns: 1fr 1.7fr;
		gap: 44px;
		padding: 52px 0;
		border-bottom: 1px solid #cbcfc3;
		scroll-margin-top: 24px;
	}
	h2 {
		font-size: 34px;
		font-weight: 500;
		line-height: 1.08;
		letter-spacing: -1.4px;
		margin: 20px 0;
	}
	.caption > span,
	small {
		color: #78816e;
	}
	.caption p {
		font-size: 14px;
		color: #697160;
		line-height: 1.65;
		max-width: 330px;
	}
	.caption .watch {
		font-size: 12px;
		border-left: 2px solid #c95736;
		padding-left: 12px;
		margin-top: 22px;
	}
	button {
		color: inherit;
		background: transparent;
		border: 1px solid #aeb4a3;
		border-radius: 5px;
		padding: 10px 13px;
		cursor: pointer;
		font-size: 12px;
	}
	button:hover {
		background: #e4e8da;
	}
	button:disabled {
		cursor: default;
		opacity: 0.45;
	}
	button:focus-visible,
	a:focus-visible,
	summary:focus-visible,
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid #c95736;
		outline-offset: 4px;
	}
	.caption > button {
		margin: 8px 5px 0 0;
	}
	.stage {
		min-width: 0;
		min-height: 280px;
		background: #e8ebdf;
		border-radius: 6px;
		padding: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.dashboard {
		gap: 12px;
	}
	aside {
		width: 32px;
		flex-shrink: 0;
		align-self: stretch;
		background: #353c2d;
		color: #f4f2eb;
		display: grid;
		place-items: center;
		border-radius: 7px;
	}
	aside.expanded {
		width: 100px;
	}
	aside span {
		display: block;
		font:
			18px Georgia,
			serif;
	}
	label {
		display: grid;
		gap: 8px;
		font-size: 12px;
		margin: 15px 0;
	}
	input {
		width: 100%;
		accent-color: #c95736;
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		background: #f8f9f3;
		color: inherit;
		border: 1px solid #bcc3af;
		border-radius: 5px;
		padding: 10px;
		font: inherit;
		resize: vertical;
	}
	.content-stack {
		min-width: 0;
	}
	.note {
		background: #f8f9f3;
		padding: 20px;
	}
	h3 {
		font:
			24px Georgia,
			serif;
		margin: 0 0 14px;
	}
	.note p {
		font-size: 13px;
		line-height: 1.65;
		color: #68715d;
		overflow-wrap: anywhere;
	}
	.live-copy {
		white-space: pre-wrap;
	}
	.receipt {
		border: 1px dashed #9ca98d;
		padding: 16px;
		margin-top: 16px;
		font-size: 12px;
	}
	.receipt span {
		display: block;
	}
	.shelf-stage {
		padding: 24px 0;
	}
	.scroller {
		width: 100%;
		overflow-x: auto;
		padding: 16px 0;
	}
	.shelves {
		display: flex;
		align-items: center;
		width: max-content;
		gap: 10px;
		padding: 0 24px;
	}
	.shelf {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		width: 160px;
		height: 180px;
		padding: 20px;
		border: 0;
		background: #f8f9f3;
		font:
			22px Georgia,
			serif;
	}
	.shelf.selected {
		background: #e1dfce;
	}
	.shelf:nth-child(even) {
		width: 220px;
		height: 210px;
	}
	.shelf > span:not(.marker) {
		position: relative;
		z-index: 1;
	}
	.shelf-number {
		font:
			10px ui-monospace,
			monospace;
		color: #758067;
	}
	.marker {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 10px;
		height: 4px;
		background: #ce5938;
	}
	.comparison {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14px;
	}
	.comparison small {
		display: block;
		font-size: 8px;
		margin-bottom: 8px;
	}
	.text-surface {
		width: 60%;
		height: 160px;
		background: #d3dac6;
		padding: 12px;
		box-sizing: border-box;
	}
	.text-surface.wide {
		width: 100%;
	}
	.text-surface p {
		margin: 0;
		font:
			20px/1.35 Georgia,
			serif;
	}
	details {
		font-size: 12px;
		margin-top: 18px;
	}
	summary {
		cursor: pointer;
	}
	pre {
		font:
			10px/1.6 ui-monospace,
			monospace;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.wait-card {
		width: 150px;
		padding: 24px;
		text-align: center;
		background: #353c2d;
		color: #f4f2eb;
		border-radius: 10px;
	}
	.wait-card small {
		color: #ced5c3;
	}
	.wait-card strong {
		display: block;
		font:
			90px Georgia,
			serif;
		margin-top: 12px;
	}
	.empty {
		color: #78816e;
		font-size: 13px;
	}
	.policies {
		flex-direction: column;
		align-items: stretch;
		gap: 14px;
	}
	.policy-rail {
		display: flex;
		padding: 6px;
		background: #d4dac8;
		border-radius: 40px;
	}
	.policy-rail.moved {
		justify-content: flex-end;
	}
	.policy-dot {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #ce5938;
	}
	.policy-dot.reduced {
		background: #353c2d;
	}
	footer {
		font-size: 12px;
		gap: 20px;
	}
	@media (max-width: 760px) {
		main {
			padding: 0 22px;
		}
		section {
			grid-template-columns: 1fr;
			gap: 24px;
			padding: 38px 0;
		}
		.caption p {
			max-width: 100%;
		}
		.stress-bar {
			flex-wrap: wrap;
		}
		.stress-bar > div {
			flex-basis: 100%;
		}
		.stage {
			padding: 18px;
		}
		.shelf-stage {
			padding-inline: 0;
		}
		nav {
			gap: 15px;
		}
	}
</style>
