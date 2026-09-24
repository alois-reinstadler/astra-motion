<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import { createMotion } from '../motion/motion.svelte.js';
	import { motionValue, motionStore, mapValue, springValue, stagger } from '../motion/values.js';
	import VariantTile from './VariantTile.svelte';
	import { shouldReduceMotion } from '../motion/policy.js';

	let { reduced = $bindable(false) }: { reduced?: boolean } = $props();
	let open = $state(true);
	let expanded = $state(false);
	let sequence = $state(false);
	let taps = $state(0);
	let dragging = $state(false);
	let dragLimit = $state(180);
	let stressCount = $state(0);
	let stressTimer: ReturnType<typeof setTimeout> | undefined;
	let stressing = $state(false);

	const card = createMotion(() => ({
		initial: { opacity: 0, scale: 0.94, y: 16 },
		animate: { opacity: 1, scale: 1, y: 0, backgroundColor: expanded ? '#ece1cb' : '#f8f6ef' },
		exit: { opacity: 0, scale: 0.9, y: -20 },
		layout: true
	}));
	const cardPresence = card.transition;
	const cardContent = createMotion({ layout: { mode: 'position' } });
	const constellation = createMotion(() => ({
		initial: 'rest',
		animate: sequence ? 'lifted' : 'rest',
		variants: { rest: { opacity: 1 }, lifted: { opacity: 1 } },
		transition: { delayChildren: stagger(0.075), type: 'spring', stiffness: 330, damping: 27 }
	}));
	const pressable = createMotion({
		initial: false,
		animate: { scale: 1, backgroundColor: '#343c2b', outlineColor: '#c9563700', outlineOffset: 0 },
		whileHover: { scale: 1.055, backgroundColor: '#4b563d' },
		whileTap: { scale: 0.94 },
		whileFocus: { outlineColor: '#c95637', outlineOffset: 5 }
	});

	const progress = motionValue(32);
	const progressStore = motionStore(progress);
	const directX = mapValue(progress, [0, 100], [0, 180]);
	const smooth = springValue(progress, { stiffness: 240, damping: 24 });
	const smoothX = mapValue(smooth, [0, 100], [0, 180]);
	const direct = createMotion({ style: { x: directX }, initial: false });
	const follower = createMotion(() => ({
		style: {
			x: shouldReduceMotion({ reducedMotion: reduced ? 'always' : 'user' }) ? directX : smoothX
		},
		initial: false
	}));
	const dragX = motionValue(0);
	const dragY = motionValue(0);
	const draggable = createMotion(() => ({
		style: { x: dragX, y: dragY },
		initial: false,
		animate: { scale: 1 },
		whileDrag: { scale: 1.06 },
		whileFocus: { scale: 1.04 },
		drag: true,
		dragConstraints: { left: 0, right: dragLimit, top: -36, bottom: 36 },
		dragTransition: { timeConstant: 180 },
		onDragStart: () => {
			dragging = true;
		},
		onDragEnd: () => {
			dragging = false;
		}
	}));
	function measureDragBounds(node: HTMLElement) {
		const observer = new ResizeObserver(([entry]) => {
			dragLimit = Math.max(0, entry.contentRect.width - 128);
		});
		observer.observe(node);
		return () => observer.disconnect();
	}
	function resetDrag() {
		dragX.jump(0);
		dragY.jump(0);
	}
	function keyboardDrag(event: KeyboardEvent) {
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-20, 0],
			ArrowRight: [20, 0],
			ArrowUp: [0, -20],
			ArrowDown: [0, 20]
		};
		if (event.key === 'Home') {
			event.preventDefault();
			resetDrag();
			return;
		}
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		dragX.jump(Math.max(0, Math.min(dragLimit, dragX.get() + move[0])));
		dragY.jump(Math.max(-36, Math.min(36, dragY.get() + move[1])));
	}
	function stopStress() {
		clearTimeout(stressTimer);
		stressing = false;
	}
	function runStress() {
		stopStress();
		stressCount = 0;
		stressing = true;
		const step = () => {
			open = !open;
			expanded = !expanded;
			stressCount++;
			if (stressCount < 20) stressTimer = setTimeout(step, 85);
			else {
				stressing = false;
				open = true;
			}
		};
		step();
	}
	onDestroy(() => {
		stopStress();
		for (const value of [progress, directX, smooth, smoothX, dragX, dragY]) value.destroy();
	});
</script>

<svelte:head
	><title>Astra / Motion, with state</title><meta
		name="description"
		content="Try native Svelte motion targets, reversible presence, variants, values and gestures."
	/></svelte:head
>

<main>
	<header>
		<a class="brand" href={resolve('/motion-lab')}>astra<span>®</span></a><span class="eyebrow"
			>THE MOTION LABORATORY / 003</span
		>
	</header>
	<div class="intro">
		<p class="eyebrow">STATE / PRESENCE / INTERACTION</p>
		<h1>Give it a state.<br /><em>Change your mind.</em></h1>
		<p class="lede">
			The next layer of the lab. Let things enter, interrupt them halfway, move the destination.
			Every example keeps its native HTML element.
		</p>
		<nav aria-label="Other experiments">
			<a href={resolve('/motion-lab')}>Layout experiments </a><a
				href={resolve('/motion-lab/extended')}
				>More stress tests
			</a>
		</nav>
	</div>
	<div class="policy">
		<div>
			<strong>One motion policy.</strong>
			<p>All examples inherit the same defaults. Your device preference applies automatically.</p>
		</div>
		<label class="switch"><input type="checkbox" bind:checked={reduced} /> Reduce motion</label>
	</div>

	<section id="presence" class="experiment">
		<div class="section-heading">
			<span class="number">01</span>
			<div>
				<h2>Arrive. Change. Leave.</h2>
				<p>
					Fade and scale share the same element as layout. Try resizing during an exit, then bring
					it back.
				</p>
			</div>
		</div>
		<div class="controls">
			<button
				data-state="toggle"
				onclick={() => {
					stopStress();
					open = !open;
				}}>{open ? 'Hide card' : 'Show card'}</button
			><button
				data-state="resize"
				aria-pressed={expanded}
				onclick={() => {
					expanded = !expanded;
				}}>Change size</button
			><button data-state="stress" onclick={runStress} disabled={stressing}
				>20 rapid reversals</button
			><output aria-live="off"
				>{stressCount ? `${stressCount} / 20` : '85 ms between changes'}</output
			>
		</div>
		<div class="presence-stage" class:expanded>
			{#if open}
				<article
					{...card.props}
					transition:cardPresence
					class="sample-card"
					data-state="presence-card"
				>
					<div {...cardContent.props} class="sample-content">
						<div class="card-top">
							<span class="eyebrow">FIELD NOTE / 001</span>
						</div>
						<div class="orb" aria-hidden="true"><span></span><span></span><span></span></div>
						<h3>A little room<br />to change.</h3>
						<p>Same content. New geometry.</p>
					</div>
				</article>
			{/if}
			<span class="stage-caption">A real article, retained through its outro.</span>
		</div>
		<details>
			<summary>See the binding</summary>
			<pre><code
					>{`const card = createMotion({
  initial: { opacity: 0, scale: 0.94, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: -20 },
  layout: true
});
const cardPresence = card.transition;

{#if open}
  <article {...card.props} transition:cardPresence>…</article>
{/if}`}</code
				></pre>
		</details>
	</section>

	<section id="variants" class="experiment">
		<div class="section-heading">
			<span class="number">02</span>
			<div>
				<h2>One cue. A small procession.</h2>
				<p>
					A parent changes its named state. Six children inherit it, with 75 ms between starts.
					Switch back before the last one moves.
				</p>
			</div>
		</div>
		<div class="controls">
			<button
				data-state="sequence"
				aria-pressed={sequence}
				onclick={() => {
					sequence = !sequence;
				}}>{sequence ? 'Settle the sequence' : 'Lift the sequence'}</button
			><span class="pill">{sequence ? 'lifted' : 'rest'}</span>
		</div>
		<div {...constellation.props} class="variant-stage" data-state="variants">
			{#each ['Form', 'Space', 'Colour', 'Rhythm', 'Weight', 'Motion'] as label, index (label)}<VariantTile
					number={index + 1}
					{label}
				/>{/each}
		</div>
		<details>
			<summary>See the parent and child</summary>
			<pre><code
					>{`// Parent
createMotion(() => ({
  animate: lifted ? 'lifted' : 'rest',
  variants: { rest: { opacity: 1 }, lifted: { opacity: 1 } },
  transition: { delayChildren: stagger(0.075) }
}));

// Each child uses its own binding; no animate label needed.
createMotion({
  variants: {
    rest: { y: 0, opacity: 0.5 },
    lifted: { y: -24, opacity: 1 }
  }
});`}</code
				></pre>
		</details>
	</section>

	<div class="split">
		<section id="values" class="experiment">
			<div class="section-heading">
				<span class="number">03</span>
				<div>
					<h2>A value. Two responses.</h2>
					<p>The first marker follows your input. The second catches up with a spring.</p>
				</div>
			</div>
			<div class="value-stage">
				<div class="value-lane">
					<span {...direct.props} class="value-marker direct" aria-hidden="true"></span><span
						class="lane-label">DIRECT</span
					>
				</div>
				<div class="value-lane">
					<span {...follower.props} class="value-marker spring" aria-hidden="true"></span><span
						class="lane-label">SPRING</span
					>
				</div>
			</div>
			<label class="slider-label" for="motion-progress"
				>Position <output>{$progressStore.toFixed(0)} / 100</output></label
			><input
				id="motion-progress"
				type="range"
				min="0"
				max="100"
				step="1"
				bind:value={$progressStore}
			/>
			<details>
				<summary>See the value bridge</summary>
				<pre><code
						>{`const progress = motionValue(32);
const position = motionStore(progress);
const smooth = springValue(progress);
const x = mapValue(smooth, [0, 100], [0, 180]);
const marker = createMotion({ style: { x } });

<input type="range" bind:value={$position} />
<span {...marker.props}></span>`}</code
					></pre>
			</details>
		</section>
		<section id="gestures" class="experiment">
			<div class="section-heading">
				<span class="number">04</span>
				<div>
					<h2>Small, useful feedback.</h2>
					<p>Hover, press, or reach this button with Tab. Each interaction has its own state.</p>
				</div>
			</div>
			<div class="gesture-stage">
				<button
					{...pressable.props}
					class="pressable"
					data-state="pressable"
					onclick={() => {
						taps++;
					}}
					>Give it a press
				</button><output aria-live="polite"
					>{taps === 0
						? 'Ready when you are.'
						: `${taps} ${taps === 1 ? 'press' : 'presses'}. Try the keyboard, too.`}</output
				>
			</div>
			<details>
				<summary>See the interaction states</summary>
				<pre><code
						>{`createMotion({
  animate: { scale: 1 },
  whileHover: { scale: 1.055 },
  whileTap: { scale: 0.94 },
  whileFocus: { outlineColor: '#c95637', outlineOffset: 5 }
});`}</code
					></pre>
			</details>
		</section>
	</div>

	<section id="drag" class="experiment">
		<div class="section-heading">
			<span class="number">05</span>
			<div>
				<h2>A little momentum.</h2>
				<p>
					Drag, release, catch it again. Movement stays inside numeric bounds. Arrow keys move the
					card; Home returns it.
				</p>
			</div>
		</div>
		<div class="controls">
			<button onclick={resetDrag}>Reset position</button><span class="pill"
				>{dragging ? 'Dragging' : 'Ready'}</span
			>
		</div>
		<div {@attach measureDragBounds} class="drag-stage">
			<span class="drag-cross" aria-hidden="true">+</span><button
				{...draggable.props}
				class="drag-card"
				onkeydown={keyboardDrag}
				aria-label="Draggable card. Use arrow keys to move, Home to reset."
				data-state="draggable"
				><span class="eyebrow">PICK ME UP</span><strong>Move<br /><em>freely.</em></strong><span
					aria-hidden="true">⠿</span
				></button
			><span class="stage-caption">Drag and release · no queued destinations</span>
		</div>
		<details>
			<summary>See the drag binding</summary>
			<pre><code
					>{`const card = createMotion({
  drag: true,
  dragConstraints: { left: 0, right: 180, top: -36, bottom: 36 },
  whileDrag: { scale: 1.06 },
  dragTransition: { timeConstant: 180 }
});

<button {...card.props}>Move freely.</button>`}</code
				></pre>
		</details>
	</section>
	<footer>
		<strong>Things to watch for</strong>
		<p>
			A flash on first load. A jump during reversal. A stretched line of text. A drag that keeps
			moving after you grab it. These are experiments to put pressure on the runtime.
		</p>
		<a href={resolve('/motion-lab')}>Back to the full laboratory </a>
	</footer>
</main>

<style>
	:global(body) {
		background: #f4f2eb;
	}
	main {
		max-width: 1120px;
		margin: 0 auto;
		padding: 30px 36px 72px;
		color: #343c2b;
		font-family: 'Instrument Sans Variable', sans-serif;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		padding-bottom: 28px;
		border-bottom: 1px solid #343c2b35;
	}
	.brand {
		font:
			500 33px/1 Georgia,
			serif;
		letter-spacing: -0.075em;
		text-decoration: none;
		color: inherit;
	}
	.brand span {
		font-size: 13px;
		vertical-align: top;
		margin-left: 3px;
	}
	.eyebrow {
		font-size: 10px;
		letter-spacing: 0.13em;
	}
	.intro {
		padding: 58px 0 38px;
	}
	h1 {
		margin: 18px 0 24px;
		font:
			400 clamp(48px, 7vw, 85px)/0.99 Georgia,
			serif;
		letter-spacing: -0.055em;
	}
	h1 em {
		color: #c95637;
		font-weight: 400;
	}
	.lede {
		max-width: 555px;
		font-size: 16px;
		line-height: 1.65;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 22px;
		margin-top: 25px;
	}
	a {
		color: inherit;
		text-underline-offset: 5px;
	}
	nav a {
		font-size: 12px;
	}
	.policy {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 25px;
		padding: 23px 25px;
		background: #e9e9df;
		border: 1px solid #343c2b20;
		border-radius: 3px;
	}
	.policy strong {
		font-size: 14px;
		font-weight: 500;
	}
	.policy p {
		font-size: 12px;
		margin: 7px 0 0;
		opacity: 0.7;
	}
	.switch {
		display: flex;
		align-items: center;
		white-space: nowrap;
		gap: 9px;
		font-size: 12px;
	}
	input {
		accent-color: #c95637;
	}
	.experiment {
		padding: 46px 0 36px;
		border-bottom: 1px solid #343c2b30;
	}
	.section-heading {
		display: flex;
		gap: 20px;
	}
	.number {
		font-size: 11px;
		padding-top: 9px;
		opacity: 0.65;
	}
	h2 {
		font:
			400 30px/1.2 Georgia,
			serif;
		letter-spacing: -0.025em;
		margin: 0 0 10px;
	}
	.section-heading p {
		max-width: 565px;
		margin: 0;
		font-size: 13px;
		line-height: 1.6;
		opacity: 0.7;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 9px;
		margin: 24px 0;
	}
	button {
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.controls button {
		border: 1px solid #343c2b80;
		border-radius: 30px;
		background: transparent;
		padding: 9px 15px;
		font-size: 12px;
	}
	.controls button:hover {
		background: #e7e7dc;
	}
	.controls button[aria-pressed='true'] {
		background: #343c2b;
		color: #f4f2eb;
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.controls output {
		margin-left: auto;
		font:
			10px ui-monospace,
			monospace;
		opacity: 0.6;
	}
	.pill {
		font-size: 10px;
		padding: 7px 11px;
		background: #e7e7dc;
		border-radius: 20px;
	}
	.presence-stage {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		position: relative;
		min-height: 335px;
		padding: 30px;
		border: 1px solid #343c2b25;
		background: #edece3;
		border-radius: 3px;
	}
	.presence-stage.expanded {
		justify-content: flex-end;
	}
	.sample-card {
		width: 235px;
		min-height: 255px;
		border: 1px solid #343c2b45;
		border-radius: 5px;
		background: #f8f6ef;
	}
	.expanded .sample-card {
		width: min(390px, 100%);
	}
	.sample-content {
		padding: 20px;
	}
	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.card-top > span:last-child {
		font-size: 20px;
	}
	.orb {
		position: relative;
		width: 77px;
		height: 77px;
		margin: 22px 0 19px;
		border: 1px solid #c95637;
		border-radius: 50%;
		overflow: hidden;
	}
	.orb span {
		position: absolute;
		inset: 0;
		border: 1px solid #c95637;
		border-radius: 50%;
	}
	.orb span:nth-child(1) {
		left: 25%;
		right: 25%;
	}
	.orb span:nth-child(2) {
		top: 25%;
		bottom: 25%;
	}
	.orb span:nth-child(3) {
		top: 46%;
		bottom: 46%;
	}
	h3 {
		margin: 0 0 9px;
		font:
			400 28px/1.02 Georgia,
			serif;
		letter-spacing: -0.03em;
	}
	.sample-content p {
		margin: 0;
		font-size: 11px;
		opacity: 0.65;
	}
	.stage-caption {
		position: absolute;
		right: 18px;
		bottom: 12px;
		font-size: 9px;
		opacity: 0.5;
	}
	details {
		margin-top: 20px;
	}
	summary {
		cursor: pointer;
		font-size: 11px;
		width: fit-content;
	}
	pre {
		overflow-x: auto;
		padding: 20px;
		background: #e9e9df;
		border-radius: 3px;
		font:
			11px/1.7 ui-monospace,
			monospace;
	}
	.variant-stage {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 10px;
		padding-top: 28px;
	}
	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 45px;
	}
	.value-stage {
		width: 230px;
		margin: 28px auto 20px;
	}
	.value-lane {
		position: relative;
		height: 56px;
		border-top: 1px solid #343c2b25;
	}
	.value-marker {
		position: absolute;
		top: 9px;
		display: block;
		width: 25px;
		height: 25px;
		border-radius: 50%;
	}
	.value-marker.direct {
		background: #c95637;
	}
	.value-marker.spring {
		background: #343c2b;
	}
	.lane-label {
		position: absolute;
		top: 39px;
		font-size: 8px;
		letter-spacing: 0.12em;
		opacity: 0.6;
	}
	.slider-label {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		margin-bottom: 12px;
	}
	input[type='range'] {
		width: 100%;
	}
	.gesture-stage {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		min-height: 204px;
		gap: 25px;
	}
	.pressable {
		display: flex;
		gap: 35px;
		align-items: center;
		padding: 18px 24px;
		border: 0;
		border-radius: 4px;
		outline: 2px solid transparent;
		color: #f4f2eb;
		font-size: 14px;
		background: #343c2b;
	}
	.pressable span {
		font-size: 21px;
	}
	.gesture-stage output {
		font-size: 10px;
		opacity: 0.6;
	}
	.drag-stage {
		height: 235px;
		position: relative;
		padding: 24px;
		border: 1px dashed #343c2b55;
		border-radius: 3px;
		background: #edece3;
	}
	.drag-cross {
		position: absolute;
		right: 28px;
		top: 20px;
		font:
			23px Georgia,
			serif;
		opacity: 0.3;
	}
	.drag-card {
		display: flex;
		flex-direction: column;
		position: absolute;
		left: 24px;
		top: 65px;
		width: 128px;
		height: 126px;
		text-align: left;
		padding: 15px;
		background: #c95637;
		color: #f7f3e9;
		border: 0;
		border-radius: 4px;
		cursor: grab;
		user-select: none;
	}
	.drag-card:active {
		cursor: grabbing;
	}
	.drag-card strong {
		font:
			400 28px/1.02 Georgia,
			serif;
		margin-top: 10px;
		letter-spacing: -0.035em;
	}
	.drag-card .eyebrow {
		font-size: 8px;
	}
	.drag-card > span:last-child {
		position: absolute;
		right: 14px;
		bottom: 10px;
		font-size: 22px;
	}
	footer {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 12px 35px;
		padding-top: 35px;
		font-size: 12px;
	}
	footer strong {
		font-weight: 500;
	}
	footer p {
		margin: 0;
		line-height: 1.7;
		opacity: 0.7;
	}
	footer a {
		grid-column: 2;
		width: fit-content;
		font-size: 11px;
	}
	@media (max-width: 700px) {
		main {
			padding: 24px 20px 50px;
		}
		header .eyebrow {
			max-width: 160px;
			text-align: right;
			line-height: 1.5;
		}
		.intro {
			padding-top: 40px;
		}
		.policy {
			align-items: flex-start;
			flex-direction: column;
			gap: 16px;
		}
		.variant-stage {
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
			row-gap: 35px;
		}
		.split {
			grid-template-columns: 1fr;
			gap: 0;
		}
		.controls output {
			margin-left: 0;
			width: 100%;
			padding-top: 6px;
		}
		.presence-stage {
			padding: 22px;
			min-height: 330px;
		}
		footer {
			grid-template-columns: 1fr;
		}
		footer a {
			grid-column: 1;
		}
	}
</style>
