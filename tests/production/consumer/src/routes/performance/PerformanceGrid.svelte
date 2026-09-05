<script lang="ts">
	import { flushSync, untrack } from 'svelte';
	import { createLayout } from 'astra-motion/layout';
	import { presence, popLayout } from 'astra-motion/presence';

	let { count, mode }: { count: number; mode: 'automatic' | 'explicit' | 'instant' } = $props();
	const initial = untrack(() => Array.from({ length: count }, (_, id) => id));
	const layout = createLayout({
		automatic: untrack(() => mode === 'automatic'),
		reducedMotion: 'never'
	});
	const attach = layout({ mode: 'position' });
	const pop = popLayout();
	let items = $state([...initial]);
	let saved: number[] | undefined;
	let narrow = $state(false);
	let grid: HTMLElement | undefined;
	function trackGrid(node: HTMLElement) {
		grid = node;
		return () => {
			grid = undefined;
		};
	}

	export function mutate(kind: 'reverse' | 'resize' | 'remove' | 'undo' | 'rotate' | 'reset') {
		const started = performance.now();
		const change = () => {
			if (kind === 'reverse') items = items.toReversed();
			if (kind === 'rotate') items = [...items.slice(17), ...items.slice(0, 17)];
			if (kind === 'resize') narrow = !narrow;
			if (kind === 'remove' && !saved) {
				saved = [...items];
				items = items.filter((_, index) => index % 5 !== 0);
			}
			if (kind === 'undo' && saved) {
				items = saved;
				saved = undefined;
			}
			if (kind === 'reset') {
				items = [...initial];
				saved = undefined;
				narrow = false;
			}
		};
		if (mode === 'explicit') layout.update(change);
		else flushSync(change);
		return performance.now() - started;
	}

	export function stats() {
		return layout.stats();
	}
	export function verify() {
		if (!grid) throw new Error('Grid is not mounted');
		const nodes = [...grid.querySelectorAll<HTMLElement>('[data-cell]')];
		const actual = nodes.map((node) => Number(node.dataset.cell));
		let maximumResidualTransform = 0;
		let visible = 0;
		for (const node of nodes) {
			const matrix = new DOMMatrix(getComputedStyle(node).transform);
			maximumResidualTransform = Math.max(
				maximumResidualTransform,
				Math.abs(matrix.m41),
				Math.abs(matrix.m42),
				Math.abs(matrix.a - 1),
				Math.abs(matrix.d - 1)
			);
			const rect = node.getBoundingClientRect();
			if (rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth)
				visible++;
		}
		return {
			expectedCount: items.length,
			domCount: actual.length,
			uniqueCount: new Set(actual).size,
			orderMatches: actual.join(',') === items.join(','),
			maximumResidualTransform,
			visible,
			...layout.stats()
		};
	}
</script>

<div class="grid" class:narrow {@attach trackGrid} data-grid>
	{#each items as id (id)}
		{#if mode === 'instant'}
			<div class="cell" data-cell={id}>{String(id + 1).padStart(3, '0')}</div>
		{:else}
			<div
				class="cell"
				data-cell={id}
				{@attach attach}
				{@attach pop}
				transition:presence={{ duration: 160, reducedMotion: 'never' }}
			>
				{String(id + 1).padStart(3, '0')}
			</div>
		{/if}
	{/each}
</div>

<style>
	.grid {
		position: relative;
		width: 1120px;
		display: grid;
		grid-template-columns: repeat(20, minmax(0, 1fr));
		gap: 3px;
	}
	.grid.narrow {
		width: 896px;
		grid-template-columns: repeat(16, minmax(0, 1fr));
	}
	.cell {
		height: 22px;
		display: grid;
		place-items: center;
		background: #dde3d1;
		border: 1px solid #b6c0a7;
		color: #253221;
		font: 10px/1 monospace;
		box-sizing: border-box;
	}
	.cell:nth-child(7n) {
		background: #e0b89e;
		border-color: #c39070;
	}
</style>
