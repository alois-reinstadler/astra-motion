<!-- Motion 13.4.4 @ 33f6e72; attribution: tests/motion-baseline. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { Reorder, AnimatePresence, type ReorderAxis } from '../motion/index.js';
	import Item from './UpstreamReorderExpandedItem.svelte';
	let {
		layout = 'column',
		axis,
		mode = '',
		count = 4,
		scaled = false,
		custom = false
	}: {
		layout?: string;
		axis?: ReorderAxis;
		mode?: string;
		count?: number;
		scaled?: boolean;
		custom?: boolean;
	} = $props();
	let values = $state<number[]>(Array.from({ length: untrack(() => count) }, (_, i) => i));
	let currentLayout = $state(untrack(() => layout));
	let width = $state(260);
	let selected = $state(-1);
	let visualExpanded = $state(false);
	let exits = $state(0);
	let currentAxis = $state(untrack(() => axis));
	const itemRefs = new SvelteMap<number, () => HTMLElement | null>();
	let group = $state<HTMLElement | null>(null);
	const style = $derived(
		`position:relative;display:${currentLayout === 'grid' ? 'grid' : 'flex'};grid-template-columns:80px 80px;flex-direction:${currentLayout === 'column' ? 'column' : 'row'};flex-wrap:${currentLayout.startsWith('wrap') ? 'wrap' : 'nowrap'};direction:${currentLayout === 'wrap-rtl' ? 'rtl' : 'ltr'};gap:${mode === 'gaps' ? 120 : 20}px;width:${currentLayout.startsWith('wrap') || currentLayout === 'grid' ? 180 : width}px;margin:0;padding:0;`
	);
	const visible = $derived(mode === 'virtual' ? values.slice(1, 4) : values);
	export function read() {
		return {
			values: [...values],
			selected,
			group,
			firstRef: itemRefs.get(0)?.(),
			exits,
			axis: currentAxis
		};
	}
	export function changeLayout(next: string) {
		currentLayout = next;
	}
	export function resize() {
		width = 420;
	}
	export function remove(value: number) {
		values = values.filter((v) => v !== value);
	}
	export function insert(value: number) {
		values = [...values, value];
	}
	export function animateVisuals() {
		visualExpanded = true;
	}
	function resized() {
		if (mode === 'responsive') {
			currentAxis = matchMedia('(max-width: 600px)').matches ? 'x' : 'y';
			currentLayout = currentAxis === 'x' ? 'row' : 'column';
		}
	}
	const groupProps = $derived({
		axis: currentAxis,
		values,
		onReorder: (next: number[]) => (values = next),
		style,
		'data-testid': 'group'
	});
</script>

<svelte:window onresize={resized} />
{#snippet content()}
	<AnimatePresence items={visible} key={(value) => value} onExitComplete={() => exits++}>
		{#snippet children(value)}
			<Item
				register={(value, element) => itemRefs.set(value, element)}
				{value}
				{group}
				{scaled}
				{custom}
				expanded={visualExpanded && value === 0}
				constrained={mode === 'constraints'}
				onSelect={(v) => (selected = v)}
			/>
		{/snippet}
	</AnimatePresence>
{/snippet}

{#if mode === 'page-scroll' || mode === 'scrolled-container'}<div style="height:350px;"></div>{/if}
<div
	data-testid="scroller"
	style={`position:relative;overflow:${mode === 'page-scroll' ? 'visible' : 'auto'};height:${mode === 'page-scroll' ? 'auto' : '240px'};width:520px;transform:${scaled ? 'scale(.5)' : 'none'};transform-origin:0 0;`}
>
	{#if custom}<Reorder.Group as="article" {...groupProps} bind:ref={group}
			>{@render content()}</Reorder.Group
		>
	{:else}<Reorder.Group as="ul" {...groupProps} bind:ref={group}>{@render content()}</Reorder.Group
		>{/if}
</div>
{#if mode === 'page-scroll' || mode === 'scrolled-container'}<div style="height:1800px;"></div>{/if}
<output data-testid="order">{values.join(',')}</output>
