<script lang="ts">
	import {
		motion,
		useScroll,
		useTransform,
		useReducedMotion,
		motionStore
	} from '$lib/motion/index.js';

	let container = $state<HTMLElement>();
	const { scrollYProgress } = useScroll(() => ({ container }));
	const progress = motionStore(scrollYProgress);
	const reduced = useReducedMotion();
	const phase = $derived($progress < 0.35 ? 0 : $progress < 0.7 ? 1 : 2);
	const chapters = ['Find the pieces.', 'Bring them together.', 'Let them go.'];
	const poses = [
		[
			'translate(-38%, 90%) rotate(-24deg)',
			'translate(0%, 0%) rotate(0deg)',
			'translate(0%, 0%) rotate(0deg)',
			'translate(35%, -35%) rotate(12deg)'
		],
		[
			'translate(38%, 10%) rotate(18deg)',
			'translate(0%, 0%) rotate(0deg)',
			'translate(0%, 0%) rotate(0deg)',
			'translate(-30%, 0%) rotate(-12deg)'
		],
		[
			'translate(-20%, -65%) rotate(-12deg)',
			'translate(0%, 0%) rotate(0deg)',
			'translate(0%, 0%) rotate(0deg)',
			'translate(25%, 40%) rotate(16deg)'
		]
	];
	const cards = ['MAKE', 'IT', 'MOVE.'].map((word, index) => ({
		word,
		transform: useTransform(scrollYProgress, [0, 0.4, 0.6, 1], poses[index])
	}));
	const orbit = useTransform(
		scrollYProgress,
		[0, 1],
		['rotate(-90deg) scale(0.65)', 'rotate(90deg) scale(1.15)']
	);
</script>

<div class="example" class:reduced={reduced.current}>
	<div class="reading-label">
		<span>SCROLL STUDY / 001</span><span>{Math.round($progress * 100)}%</span>
	</div>
	<progress aria-label="Composition progress" max="1" value={$progress}></progress>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (This scroll-driven composition supports keyboard scrolling.) -->
	<section
		class="reader"
		tabindex="0"
		aria-label="Scroll to scatter, gather and release the composition"
		{@attach (node) => {
			container = node;
			return () => {
				container = undefined;
			};
		}}
	>
		<div class="scroll-travel">
			<div class="pinned-stage">
				<div class="stage-caption">
					<span>0{phase + 1} / {['SCATTER', 'GATHER', 'RELEASE'][phase]}</span><span>
						SCROLL TO COMPOSE</span
					>
				</div>
				<motion.div
					class="orbit"
					aria-hidden="true"
					style={{ transform: reduced.current ? 'none' : orbit }}><span></span></motion.div
				>
				<div class="composition" role="img" aria-label="Make it move">
					{#each cards as card, index (card.word)}
						<motion.div
							class="paper paper-{index}"
							aria-hidden="true"
							style={{ transform: reduced.current ? 'none' : card.transform }}
						>
							<span class="paper-index">0{index + 1}</span><strong>{card.word}</strong><span
								class="paper-mark">✳</span
							>
						</motion.div>
					{/each}
				</div>
				<div class="stage-footer">
					<h3>{chapters[phase]}</h3>
					<span>YOUR SCROLL.<br />THE CHOREOGRAPHY.</span>
				</div>
			</div>
		</div>
	</section>
	<div class="chapter-track" role="group" aria-label="Composition chapters">
		{#each ['Scatter', 'Gather', 'Release'] as chapter, index (chapter)}<span
				class:active={phase === index}><i>0{index + 1}</i> {chapter}</span
			>{/each}
	</div>
	<p class="hint">
		Scroll inside the frame, or focus it and use the Down and Up arrow keys. Reverse to unwind.
	</p>
</div>

<style>
	.example {
		width: 100%;
		margin: auto;
		background: #232820;
		color: #f7f7f0;
	}
	.reading-label {
		display: flex;
		justify-content: space-between;
		padding: 18px 22px;
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 0.09em;
		font-variant-numeric: tabular-nums;
	}
	progress {
		display: block;
		appearance: none;
		width: 100%;
		height: 3px;
		border: 0;
		background: #414a39;
		color: #e8a084;
	}
	progress::-webkit-progress-bar {
		background: #414a39;
	}
	progress::-webkit-progress-value {
		background: #e8a084;
	}
	progress::-moz-progress-bar {
		background: #e8a084;
	}
	.reader {
		position: relative;
		height: 420px;
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: #96a484 #232820;
	}
	.reader:focus-visible {
		outline: 2px solid #e8a084;
		outline-offset: -4px;
	}
	.scroll-travel {
		height: 1700px;
	}
	.pinned-stage {
		position: sticky;
		top: 0;
		height: 420px;
		overflow: hidden;
		isolation: isolate;
		background-image:
			linear-gradient(#f7f7f009 1px, transparent 1px),
			linear-gradient(90deg, #f7f7f009 1px, transparent 1px);
		background-size: 42px 42px;
	}
	.stage-caption,
	.stage-footer {
		position: absolute;
		left: 22px;
		right: 22px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 15px;
		z-index: 2;
	}
	.stage-caption {
		top: 22px;
		font:
			9px ui-monospace,
			monospace;
		color: #c5cebb;
	}
	.stage-caption > span:last-child {
		font-size: 8px;
	}
	.example :global(.orbit) {
		position: absolute;
		width: 320px;
		height: 320px;
		left: calc(50% - 160px);
		top: 50px;
		border: 1px solid #78836e;
		border-radius: 50%;
	}
	.example :global(.orbit::before) {
		content: '';
		position: absolute;
		inset: 30px;
		border: 1px solid #78836e;
		border-radius: 50%;
	}
	.example :global(.orbit span) {
		position: absolute;
		left: 50%;
		top: -7px;
		width: 14px;
		height: 14px;
		background: #d5e2a5;
		border-radius: 50%;
	}
	.composition {
		position: absolute;
		inset: 80px 0 90px;
	}
	.example :global(.paper) {
		position: absolute;
		width: 68%;
		left: 16%;
		height: 82px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		color: #232820;
		background: #edeee5;
		box-shadow: 0 8px 18px #0002;
	}
	.example :global(.paper-0) {
		top: 0;
		background: #e98564;
	}
	.example :global(.paper-1) {
		top: 80px;
		background: #d5e2a5;
	}
	.example :global(.paper-2) {
		top: 160px;
	}
	.example :global(.paper strong) {
		font-size: clamp(40px, 6vw, 68px);
		line-height: 0.9;
		font-weight: 650;
		letter-spacing: -0.07em;
	}
	.paper-index {
		align-self: flex-start;
		font:
			8px ui-monospace,
			monospace;
	}
	.paper-mark {
		align-self: flex-end;
		font-size: 19px;
	}
	.stage-footer {
		bottom: 20px;
	}
	h3 {
		font:
			italic 24px Georgia,
			serif;
		letter-spacing: -0.04em;
		margin: 0;
	}
	.stage-footer > span {
		text-align: right;
		font:
			8px/1.6 ui-monospace,
			monospace;
		color: #c5cebb;
	}
	.chapter-track {
		display: flex;
		padding: 18px 22px;
		gap: 22px;
		border-top: 1px solid #515a48;
		font-size: 11px;
	}
	.chapter-track span {
		color: #bac4ae;
	}
	.chapter-track .active {
		color: #f2b398;
	}
	.chapter-track i {
		font:
			normal 8px ui-monospace,
			monospace;
		margin-right: 4px;
	}
	.hint {
		margin: 0;
		padding: 0 22px 18px;
		color: #bac4ae;
		font-size: 10px;
		line-height: 1.6;
	}
	.reduced :global(.paper),
	.reduced :global(.orbit) {
		transform: none !important;
	}
	@media (max-width: 600px) {
		.example :global(.paper) {
			width: 76%;
			left: 12%;
			padding: 14px 10px;
		}
		.example :global(.paper strong) {
			font-size: 48px;
		}
		.stage-caption,
		.stage-footer {
			left: 16px;
			right: 16px;
		}
		.stage-caption > span:last-child {
			font-size: 7px;
		}
		.stage-footer > span {
			display: none;
		}
		.chapter-track {
			gap: 15px;
			padding-inline: 16px;
		}
	}
</style>
