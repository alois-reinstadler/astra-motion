<script lang="ts">
	import { resolve } from '$app/paths';
	import { createLayout, presence, popLayout, Presence } from '$lib/motion/index.js';
	const layout = createLayout({
		id: 'lab',
		transition: { type: 'spring', stiffness: 420, damping: 38 }
	});
	const tabsA = createLayout({ id: 'tabs-a' });
	const tabsB = createLayout({ id: 'tabs-b' });
	let open = $state(true);
	let selection = $state(0);
	let aligned = $state(false);
	let expanded = $state(false);
	let columns = $state(4);
	let tab = $state(0);
	let shared = $state(false);
	let nested = $state(false);
	let count = $state(10);
	let items = $state(Array.from({ length: 10 }, (_, id) => id));
	let listVisible = $state(true);
	const names = ['Overview', 'Specifications', 'Materials'];
	function reset() {
		items = Array.from({ length: count }, (_, id) => id);
	}
	function reorder() {
		items = [...items.slice(1), ...items.slice(0, 1)].reverse();
	}
</script>

<svelte:head
	><title>Astra / Motion laboratory</title><meta
		name="description"
		content="Presence, projection and route motion experiments for Svelte."
	/></svelte:head
>

<main>
	<header>
		<a class="brand" href={resolve('/')}>astra<span>®</span></a><span class="edition"
			>ENGINEERING / 001</span
		>
	</header>
	<div class="intro">
		<p class="eyebrow">THE MOTION LABORATORY</p>
		<h1>Space changes.<br /><em>Identity stays.</em></h1>
		<p class="lede">
			Native Svelte elements. Motion projection. Ordinary state changes, coordinated automatically
			from the last rendered geometry.
		</p>
	</div>
	<div class="status">
		<span class="dot"></span> RESEARCH PROTOTYPE <span>Svelte 5.57 · Motion DOM 13.2</span><a
			href={resolve('/motion-lab/product')}>Route experiment ↗</a
		>
	</div>

	<nav class="more-experiments" aria-label="More motion experiments">
		<a href={resolve('/motion-lab/guide')}>Start here: complete authoring guide ↗</a>
		<a href={resolve('/motion-lab/extended')}>Six more experiments + rapid stress ↗</a>
		<a href={resolve('/motion-lab/updates')}>Compare automatic and explicit updates ↗</a>
		<a href={resolve('/motion-lab/state')}>State, variants, values and interactions ↗</a>
		<a href={resolve('/motion-lab/components')}>Try the accordion, dialog and cards ↗</a>
		<a href={resolve('/motion-lab/presence')}>Coordinated exits and reversal ↗</a>
		<a href={resolve('/motion-lab/scroll')}>Scroll-linked motion ↗</a>
		<a href={resolve('/motion-lab/timelines')}>Scoped timelines ↗</a>
		<a href={resolve('/motion-lab/inheritance')}>Server-rendered child variants ↗</a>
	</nav>

	<section class="experiment">
		<div class="caption">
			<span>01 / LIFECYCLE</span>
			<h2>Here. Gone.<br />Back again.</h2>
			<p>Svelte retains the node during its outro. Reverse the transition before it finishes.</p>
			<button onclick={() => (open = !open)} data-testid="toggle-presence">Toggle presence</button>
		</div>
		<div class="stage presence-stage">
			{#if open}<div
					class="presence-card"
					data-testid="presence"
					transition:presence={{ duration: 500 }}
				>
					Svelte owns<br /><strong>the goodbye.</strong>
				</div>{/if}
		</div>
	</section>

	<section class="experiment">
		<div class="caption">
			<span>02 / SEQUENCE</span>
			<h2>One at a time.</h2>
			<p>
				Wait mode keeps the latest request. Svelte waits for the entire outgoing transition group.
			</p>
			<button onclick={() => selection++} data-testid="next-wait">Next chapter</button>
		</div>
		<div class="stage">
			<Presence value={selection}
				>{#snippet children(value)}<div
						class="chapter"
						data-testid="wait-item"
						transition:presence={{ duration: 220 }}
					>
						<small>CHAPTER</small><strong>{String(value + 1).padStart(2, '0')}</strong>
					</div>{/snippet}</Presence
			>
		</div>
	</section>

	<section class="experiment">
		<div class="caption">
			<span>03 / CSS LAYOUT</span>
			<h2>Let CSS decide.</h2>
			<p>
				Position, intrinsic height and flex alignment. No target coordinates in application code.
			</p>
			<button data-testid="align" onclick={() => (aligned = !aligned)}>Change alignment</button
			><button data-testid="accordion" onclick={() => (expanded = !expanded)}
				>Toggle accordion</button
			>
		</div>
		<div class="stage layout-stage">
			<div class="rail" style:justify-content={aligned ? 'flex-end' : 'flex-start'}>
				<div class="orb" data-testid="orb" {@attach layout()}>↗</div>
			</div>
			<div class="accordion" data-testid="accordion-box" {@attach layout()}>
				<strong {@attach layout({ mode: 'position' })}>Made for ordinary markup.</strong
				>{#if expanded}<p {@attach layout({ mode: 'position' })}>
						Normal document flow determines the height. Projection carries the old rectangle into
						the new space. Child projection compensates for parent scaling.
					</p>{/if}
			</div>
		</div>
	</section>

	<section class="experiment">
		<div class="caption">
			<span>04 / SHARED IDENTITY</span>
			<h2>Same idea.<br />Different place.</h2>
			<p>
				Two isolated scopes reuse the same underline ID. Each new node inherits its predecessor’s
				projection.
			</p>
		</div>
		<div class="stage tabs-stage">
			{#each [tabsA, tabsB] as group, groupIndex (groupIndex)}<div class="tabs">
					{#each names as name, i (name)}<button
							data-testid={`tab-${groupIndex}-${i}`}
							class:active={tab === i}
							onclick={() => (tab = i)}
							>{name}{#if tab === i}<span class="underline" {@attach group({ id: 'underline' })}
								></span>{/if}</button
						>{/each}
				</div>{/each}
		</div>
	</section>

	<section class="experiment">
		<div class="caption">
			<span>05 / NESTING & TRANSFORMS</span>
			<h2>Everything<br />has a parent.</h2>
			<p>
				Parent and child project together. Authored rotation belongs to Motion’s transform pipeline.
			</p>
			<button data-testid="nested" onclick={() => (nested = !nested)}>Change composition</button>
		</div>
		<div class="stage">
			<div class="nest" class:grown={nested} {@attach layout()}>
				<div
					class="nested-child"
					data-testid="nested-child"
					{@attach layout({ style: { rotate: -8, scale: 0.9, borderRadius: 12 } })}
				>
					Built<br />to move.
				</div>
			</div>
		</div>
	</section>

	<section class="experiment">
		<div class="caption">
			<span>06 / SHARED REPLACEMENT</span>
			<h2>A closer look.</h2>
			<p>
				Background, artwork and title move between different DOM nodes. Close and reopen during
				flight.
			</p>
			<button data-testid="shared" onclick={() => (shared = !shared)}
				>{shared ? 'Close detail' : 'Open detail'}</button
			>
		</div>
		<div class="stage shared-stage">
			{#key shared}<article
					class="product"
					class:detail={shared}
					{@attach layout({ id: 'product-background', style: { borderRadius: 16 } })}
				>
					<div class="art" {@attach layout({ id: 'product-art' })}>
						<img
							src="/object.svg"
							alt="Sculptural arch"
							width="600"
							height="500"
							data-testid="shared-image"
							{@attach layout({ id: 'product-image', mode: 'preserve-aspect' })}
						/>
					</div>
					<h3 {@attach layout({ id: 'product-title', mode: 'position' })}>Object No. 01</h3>
					{#if shared}<p {@attach layout({ mode: 'position' })}>
							An exploration of form, space, and continuity.
						</p>{/if}
				</article>{/key}
		</div>
	</section>

	<section class="experiment list-experiment">
		<div class="caption">
			<span>07 / GRID, PRESENCE & STRESS</span>
			<h2>Change the order.<br />Keep the rhythm.</h2>
			<p>
				Delete during reorder. Change column count. Scroll while things move. Exiting nodes leave
				flow immediately.
			</p>
			<div class="controls">
				<button data-testid="reorder" onclick={reorder}>Reorder</button><button
					data-testid="columns"
					onclick={() => (columns = columns === 4 ? 2 : 4)}>Change columns</button
				><button data-testid="reset" onclick={reset}>Reset list</button><button
					data-testid="destroy"
					onclick={() => (listVisible = !listVisible)}>Toggle parent</button
				><label
					>Items <select bind:value={count} onchange={reset} data-testid="count"
						><option value={1}>1</option><option value={10}>10</option><option value={100}
							>100</option
						><option value={500}>500</option></select
					></label
				>
			</div>
		</div>
		<div class="stage list-stage" {@attach layout({ scroll: true })}>
			{#if listVisible}<div
					class="grid"
					style:grid-template-columns={`repeat(${columns}, minmax(0, 1fr))`}
				>
					{#each items as id (id)}<div
							class="tile"
							data-testid={`tile-${id}`}
							{@attach layout({ style: { borderRadius: 12 } })}
							{@attach popLayout()}
							transition:presence={{ duration: 360 }}
						>
							<span {@attach layout({ mode: 'position' })}>{String(id + 1).padStart(2, '0')}</span
							><button
								{@attach layout({ mode: 'position' })}
								aria-label={`Remove item ${id + 1}`}
								data-testid={`remove-${id}`}
								onclick={() => (items = items.filter((item) => item !== id))}>×</button
							>
						</div>{/each}
				</div>{/if}
		</div>
	</section>

	<footer>
		<strong>ASTRA MOTION</strong>
		<p>Inspect the behavior. Question the abstraction.</p>
		<a href={resolve('/motion-lab/product')}>Try route continuity ↗</a>
	</footer>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f4f2eb;
		color: #252821;
	}
	main {
		max-width: 1240px;
		margin: auto;
		padding: 0 48px;
		font-family: 'Instrument Sans Variable', sans-serif;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30px 0;
		border-bottom: 1px solid #cbcfc3;
	}
	a {
		color: inherit;
		text-decoration: none;
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
	.edition,
	.eyebrow,
	.caption > span,
	.status,
	footer > strong {
		font:
			11px ui-monospace,
			monospace;
		letter-spacing: 1.4px;
	}
	.intro {
		padding: 74px 0 56px;
		max-width: 780px;
	}
	.eyebrow {
		margin-bottom: 22px;
	}
	h1 {
		font-size: clamp(54px, 7vw, 88px);
		line-height: 0.98;
		letter-spacing: -5px;
		font-weight: 500;
		margin: 0;
	}
	h1 em {
		font-family: Georgia, serif;
		font-weight: normal;
	}
	.lede {
		max-width: 440px;
		font-size: 16px;
		line-height: 1.65;
		margin: 30px 0 0;
		color: #666c5e;
	}
	.status {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 19px 0;
		border-top: 1px solid #cbcfc3;
		border-bottom: 1px solid #cbcfc3;
		letter-spacing: 0.5px;
	}
	.status > span:not(.dot) {
		margin-left: auto;
		color: #73796b;
	}
	.status a {
		margin-left: 24px;
	}
	.more-experiments {
		display: flex;
		flex-wrap: wrap;
		gap: 16px 28px;
		padding-top: 20px;
		font-size: 12px;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #ce5938;
	}
	.experiment {
		display: grid;
		grid-template-columns: 1fr 1.7fr;
		gap: 50px;
		padding: 52px 0;
		border-bottom: 1px solid #cbcfc3;
	}
	.caption > span {
		color: #7a806f;
	}
	h2 {
		font-size: 34px;
		letter-spacing: -1.4px;
		line-height: 1.1;
		font-weight: 500;
		margin: 20px 0;
	}
	.caption p {
		max-width: 300px;
		color: #71776a;
		font-size: 14px;
		line-height: 1.7;
	}
	button,
	select {
		cursor: pointer;
		border: 1px solid #aeb4a3;
		background: transparent;
		padding: 10px 14px;
		border-radius: 5px;
		font-size: 12px;
		color: inherit;
	}
	button:hover {
		background: #e4e8da;
	}
	button:focus-visible,
	select:focus-visible {
		outline: 2px solid #c95736;
		outline-offset: 4px;
	}
	.caption > button {
		margin: 12px 8px 0 0;
	}
	.stage {
		background: #e8ebdf;
		min-height: 260px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 26px;
		overflow: visible;
	}
	.presence-card {
		background: #ce5938;
		color: #f8f0dc;
		padding: 35px;
		border-radius: 16px;
		font-size: 22px;
		line-height: 1.4;
	}
	.presence-card strong {
		font-family: Georgia, serif;
		font-size: 32px;
		font-weight: normal;
	}
	.chapter {
		display: grid;
		text-align: center;
	}
	.chapter small {
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 3px;
	}
	.chapter strong {
		font:
			110px Georgia,
			serif;
	}
	.layout-stage {
		flex-direction: column;
		align-items: stretch;
		gap: 30px;
	}
	.rail {
		display: flex;
		background: #d4dac8;
		padding: 8px;
		border-radius: 48px;
	}
	.orb {
		border-radius: 50%;
		background: #353c2d;
		color: #f4f2eb;
		width: 58px;
		height: 58px;
		display: grid;
		place-items: center;
		font-size: 25px;
	}
	.accordion {
		background: #f8f9f3;
		padding: 22px;
		border-radius: 8px;
	}
	.accordion strong {
		display: block;
	}
	.accordion p {
		color: #686e61;
		font-size: 13px;
		line-height: 1.7;
		margin-bottom: 0;
	}
	.tabs-stage {
		flex-direction: column;
		gap: 30px;
	}
	.tabs {
		display: flex;
		gap: 10px;
	}
	.tabs button {
		border: 0;
		position: relative;
		padding: 15px 8px;
		color: #71776a;
	}
	.tabs button.active {
		color: #252821;
	}
	.underline {
		position: absolute;
		bottom: 0;
		left: 8px;
		right: 8px;
		height: 3px;
		background: #ce5938;
	}
	.nest {
		width: 150px;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #a5ae98;
	}
	.nest.grown {
		width: 300px;
		height: 200px;
		justify-content: flex-end;
	}
	.nested-child {
		background: #353c2d;
		color: #e8ebdf;
		padding: 20px;
		font:
			22px Georgia,
			serif;
	}
	.shared-stage {
		min-height: 330px;
	}
	.product {
		width: 150px;
		background: #f8f9f3;
		padding: 14px;
	}
	.product.detail {
		width: 300px;
	}
	.art {
		background: #d5c9a6;
		height: 100px;
		display: grid;
		place-items: center;
	}
	.detail .art {
		height: 170px;
	}
	.art img {
		display: block;
		width: 70%;
		height: auto;
	}
	.product h3 {
		font:
			20px Georgia,
			serif;
		margin: 14px 0 0;
	}
	.product p {
		font-size: 12px;
		line-height: 1.5;
		color: #71776a;
	}
	.controls {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.controls label {
		margin-top: 10px;
		font-size: 12px;
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.list-stage {
		max-height: 470px;
		overflow: auto;
		align-items: flex-start;
		display: block;
	}
	.grid {
		display: grid;
		gap: 12px;
		position: relative;
	}
	.tile {
		height: 92px;
		background: #f8f9f3;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 14px;
		min-width: 0;
	}
	.tile > span {
		font:
			22px Georgia,
			serif;
	}
	.tile > button {
		border: 0;
		padding: 0 3px;
		color: #8a927f;
	}
	footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 35px 0;
		font-size: 12px;
		color: #71776a;
	}
	@media (max-width: 760px) {
		main {
			padding: 0 22px;
		}
		h1 {
			letter-spacing: -3px;
		}
		.intro {
			padding: 45px 0;
		}
		.status {
			flex-wrap: wrap;
		}
		.status > span:not(.dot),
		.status a {
			margin-left: 0;
		}
		.experiment {
			grid-template-columns: 1fr;
			gap: 24px;
			padding: 34px 0;
		}
		.stage {
			min-height: 220px;
		}
		.caption p {
			max-width: 450px;
		}
		.tabs {
			gap: 0;
		}
		.tabs button {
			font-size: 11px;
		}
		footer {
			flex-wrap: wrap;
		}
	}
</style>
