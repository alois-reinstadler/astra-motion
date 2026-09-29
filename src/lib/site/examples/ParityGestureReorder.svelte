<script lang="ts">
	import { motion, Reorder, useDragControls } from '$lib/motion/index.js';
	const names = [
		'Outline',
		'Research',
		'Sketch',
		'Prototype',
		'Review',
		'Refine',
		'Publish',
		'Reflect'
	];
	const controls = names.map(() => useDragControls());
	let items = $state(names.map((_, index) => index));
	let grid = $state(false);
	let announcement = $state('');
	function move(value: number, direction: number) {
		const from = items.indexOf(value);
		const to = from + direction;
		if (to < 0 || to >= items.length) return;
		const next = [...items];
		[next[from], next[to]] = [next[to], next[from]];
		items = next;
		announcement = `${names[value]} moved to position ${to + 1}`;
	}
</script>

<div class="demo">
	<div class="toolbar">
		<strong>Plan the work</strong>
		<button type="button" aria-pressed={grid} onclick={() => (grid = !grid)}
			>{grid ? 'Use list' : 'Use grid'}</button
		>
	</div>
	<div class="scroll">
		<Reorder.Group
			values={items}
			onReorder={(next) => (items = next)}
			class="items"
			style={grid ? 'display:grid;grid-template-columns:1fr 1fr;gap:8px;' : 'display:grid;gap:8px;'}
		>
			{#each items as item, index (item)}
				<Reorder.Item
					value={item}
					dragListener={false}
					dragControls={controls[item]}
					class="item"
					style={{ borderRadius: 6 }}
				>
					<motion.div layout="position">
						<button
							class="handle"
							type="button"
							aria-label={`Drag ${names[item]}`}
							onpointerdown={(event) => controls[item].start(event)}>{names[item]}</button
						>
						<div class="order-actions">
							<button
								type="button"
								aria-label={`Move ${names[item]} earlier`}
								disabled={index === 0}
								onclick={() => move(item, -1)}>Earlier</button
							>
							<button
								type="button"
								aria-label={`Move ${names[item]} later`}
								disabled={index === items.length - 1}
								onclick={() => move(item, 1)}>Later</button
							>
						</div>
					</motion.div>
				</Reorder.Item>
			{/each}
		</Reorder.Group>
	</div>
	<p>Drag near an edge to scroll, or use Earlier and Later.</p>
	<output class="announcement" aria-live="polite">{announcement}</output>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 390px;
		margin: auto;
		color: #252821;
		font-size: 12px;
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 15px;
	}
	strong {
		font-weight: 500;
	}
	button {
		padding: 6px 8px;
		border: 1px solid #bfc8ae;
		border-radius: 4px;
		background: #fffdf7;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	button:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: 3px;
	}
	.scroll {
		max-height: 246px;
		overflow: auto;
		padding: 4px;
		border: 1px solid #ddded3;
		border-radius: 8px;
	}
	.demo :global(.items) {
		margin: 0;
		padding: 0;
		/* Clip projected horizontal overflow without creating another scroll container. */
		overflow-x: clip;
	}
	.demo :global(.item) {
		position: relative;
		min-width: 0;
		padding: 10px;
		list-style: none;
		border: 1px solid #bfc8ae;
		border-radius: 6px;
		background: #eeeee5;
	}
	.handle {
		width: 100%;
		margin-bottom: 8px;
		border: 0;
		text-align: left;
		background: transparent;
		font-weight: 500;
		cursor: grab;
		touch-action: none;
	}
	.order-actions {
		display: flex;
		gap: 5px;
	}
	.order-actions button {
		flex: 1;
		font-size: 10px;
	}
	p {
		margin: 12px 0 0;
		color: #62695a;
		font-size: 11px;
	}
	.announcement {
		display: block;
		min-height: 18px;
		margin-top: 8px;
		color: #536c40;
		font-size: 11px;
	}
</style>
