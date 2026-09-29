<!-- Motion 13.4.4 @ 33f6e72; attribution: tests/motion-baseline. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Reorder, motion, correctParentTransform, type GestureOptions } from '../motion/index.js';
	let {
		value,
		group,
		scaled = false,
		constrained = false,
		custom = false,
		expanded = false,
		register = () => {},
		onSelect = () => {}
	}: {
		value: number;
		group?: HTMLElement | null;
		scaled?: boolean;
		constrained?: boolean;
		custom?: boolean;
		expanded?: boolean;
		register?: (value: number, read: () => HTMLElement | null) => void;
		onSelect?: (value: number) => void;
	} = $props();
	let ref = $state<HTMLElement | null>(null);
	onMount(() => register(value, () => ref));
	const correction = $derived(scaled ? correctParentTransform(() => group) : undefined);
	const constraints = $derived<GestureOptions['dragConstraints']>(
		constrained ? () => group : undefined
	);
	const itemProps = $derived({
		value,
		'data-testid': `item-${value}`,
		'data-item': value,
		dragMomentum: false,
		dragElastic: false,
		dragConstraints: constraints,
		transformPagePoint: correction,
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0, transition: { duration: 0.3, ease: 'linear' as const } },
		transition: { duration: 0.12 },
		onclick: () => onSelect(value),
		style: 'position:relative;width:80px;height:60px;flex:none;list-style:none;background:teal;'
	});
</script>

{#snippet content()}
	<motion.span
		data-testid={`label-${value}`}
		layout="position"
		style={{ display: 'inline-block', width: expanded ? 132 : 48, whiteSpace: 'nowrap' }}
		>{expanded ? 'Expanded label ' : ''}Item {value}</motion.span
	>
	<motion.div
		data-testid={`content-${value}`}
		initial={{ opacity: 0.35 }}
		animate={{ opacity: expanded ? 1 : 0.35 }}
		transition={{ duration: 0.4, ease: 'linear' }}>Content {value}</motion.div
	>
{/snippet}
{#if custom}
	<Reorder.Item as="main" {...itemProps} bind:ref>{@render content()}</Reorder.Item>
{:else}
	<Reorder.Item as="li" {...itemProps} bind:ref>{@render content()}</Reorder.Item>
{/if}
