<script lang="ts">
	import ReorderGroup from '../motion/ReorderGroup.svelte';
	import ReorderItem from '../motion/ReorderItem.svelte';
	import { useDragControls } from '../motion/drag-controls.js';
	let values = $state([0, 1, 2, 3]);
	let grid = $state(false);
	const controls = Array.from({ length: 12 }, () => useDragControls());
	export function inspect() {
		return { values: [...values], grid };
	}
	export function remove(value: number) {
		values = values.filter((item) => item !== value);
	}
	export function insert(value: number) {
		values = [value, ...values];
	}
	export function move(value: number, index: number) {
		const next = values.filter((item) => item !== value);
		next.splice(index, 0, value);
		values = next;
	}
	export function wrap() {
		grid = !grid;
	}
	export function extend() {
		values = [...values, 4, 5, 6, 7];
	}
</script>

<div style="width:300px;height:180px;overflow:auto;position:relative;" data-reorder-scroll>
	<ReorderGroup
		as="ol"
		{values}
		onReorder={(next) => (values = next)}
		style={grid
			? 'display:grid;grid-template-columns:100px 100px;gap:10px;margin:0;padding:0;'
			: 'display:flex;flex-direction:column;gap:10px;margin:0;padding:0;'}
		data-reorder-group
	>
		{#each values as value (value)}
			<ReorderItem
				{value}
				data-reorder-item={value}
				dragListener={false}
				dragControls={controls[value]}
				style="position:relative;width:100px;height:60px;list-style:none;background:teal;"
				transition={{ duration: 0.15 }}
			>
				<button
					type="button"
					data-reorder-handle={value}
					onpointerdown={(event) => controls[value].start(event)}
					style="touch-action:none;">Move {value}</button
				>
			</ReorderItem>
		{/each}
	</ReorderGroup>
</div>
