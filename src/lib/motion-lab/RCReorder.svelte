<script lang="ts">
	import { Reorder } from '../motion/index.js';
	let { controlled = false }: { controlled?: boolean } = $props();
	const originals = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
	let values = $state.raw(originals);
	let proposals = $state(0);
	const orders: string[] = [];
	let accept = $state(false);
	let grid = $state(false);
	function propose(next: typeof values) {
		proposals++;
		orders.push(next.map((value) => value.id).join(','));
		if (accept) values = next;
	}
	export function inspect() {
		return { values, originals, proposals, orders };
	}
	export function accepting() {
		accept = true;
	}
	export function reverse() {
		values = [...values].reverse();
	}
	export function replace() {
		values = [values[2], values[0], { id: 'd' }];
	}
	export function wrap() {
		grid = true;
	}
</script>

<Reorder.Group
	bind:values
	onReorder={controlled ? propose : undefined}
	style={grid
		? 'display:grid;grid-template-columns:100px 100px;gap:10px;margin:0;padding:0;'
		: 'display:flex;flex-direction:column;gap:10px;margin:0;padding:0;'}
>
	{#each values as value (value)}
		<Reorder.Item
			{value}
			data-rc-reorder={value.id}
			transition={{ duration: 0.05 }}
			style="width:100px;height:60px;list-style:none;"
		>
			<button style="touch-action:none;">{value.id}</button>
		</Reorder.Item>
	{/each}
</Reorder.Group>
