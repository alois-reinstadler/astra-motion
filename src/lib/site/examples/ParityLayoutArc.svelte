<script lang="ts">
	import { arc, LayoutGroup, motion } from '$lib/motion/index.js';
	let atEnd = $state(false);
	let shared = $state(false);
	const namespace = $props.id();
	const path = arc({ strength: 0.7, rotate: 0.3 });
	const transition = { layout: { duration: 0.8, ease: 'easeInOut' as const, path } };
	const position = $derived({ left: atEnd ? 'calc(100% - 48px)' : 0, rotate: 8 });
</script>

<div class="demo">
	<div class="controls">
		<button type="button" onclick={() => (atEnd = !atEnd)}>
			{atEnd ? 'Move to start' : 'Move to end'}
		</button>
		<label><input type="checkbox" bind:checked={shared} /> Shared identity</label>
	</div>
	<LayoutGroup id={namespace}>
		<div class="track">
			<div class="baseline"></div>
			{#if shared}
				{#key atEnd}
					<motion.div
						class="traveller"
						layoutId="traveller"
						data-arc-position={atEnd ? 'end' : 'start'}
						style={position}
						{transition}
					>
						A
					</motion.div>
				{/key}
			{:else}
				<motion.div
					class="traveller"
					layout
					data-arc-position={atEnd ? 'end' : 'start'}
					style={position}
					{transition}
				>
					A
				</motion.div>
			{/if}
			<span class="start">Start</span><span class="end">End</span>
		</div>
	</LayoutGroup>
	<p>Move again during the animation to reverse the path.</p>
</div>

<style>
	.demo {
		width: min(100%, 330px);
		margin: auto;
		color: #252821;
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	button {
		padding: 9px 12px;
		border: 1px solid #bfc8ae;
		border-radius: 4px;
		background: #dfe5d1;
		color: inherit;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
	label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
	}
	input {
		accent-color: #bc3c21;
	}
	.track {
		position: relative;
		height: 210px;
	}
	.baseline {
		position: absolute;
		inset: 59px 24px auto;
		border-top: 1px dashed #bfc8ae;
	}
	.demo :global(.traveller) {
		position: absolute;
		top: 35px;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 8px;
		background: #bc3c21;
		color: #fffdf7;
		font-size: 22px;
		font-weight: 600;
	}
	.start,
	.end {
		position: absolute;
		top: 10px;
		color: #62695a;
		font-size: 10px;
	}
	.start {
		left: 0;
	}
	.end {
		right: 0;
	}
	p {
		margin: 0;
		color: #62695a;
		font-size: 11px;
		line-height: 1.6;
	}
</style>
