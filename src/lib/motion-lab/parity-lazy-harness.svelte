<script lang="ts">
	import { untrack } from 'svelte';
	import LazyMotion from '../motion/LazyMotion.svelte';
	import * as m from '../motion/m/index.js';
	import type { FeatureBundle, LazyFeatureBundle } from '../motion/lazy-context.js';
	import { provideActivityState } from '../motion/activity-scope.js';
	let {
		features,
		initialFalse = false,
		onCreate
	}: {
		features: FeatureBundle | LazyFeatureBundle;
		initialFalse?: boolean;
		onCreate?: (api: ReturnType<typeof getApi>) => void;
	} = $props();
	let selected = $state.raw(untrack(() => features));
	let target = $state(80);
	let present = $state(true);
	let active = $state(true);
	let drag = $state(false);
	let layout = $state(false);
	let text = $state('retained');
	let hovered = $state(0);
	let clicked = $state(0);
	let root = $state<HTMLDivElement | null>();
	let input = $state<HTMLInputElement | null>();
	let errorReset: (() => void) | undefined;
	provideActivityState(() => active);
	export function configure(next: {
		features?: FeatureBundle | LazyFeatureBundle;
		target?: number;
		present?: boolean;
		active?: boolean;
		drag?: boolean;
		layout?: boolean;
	}) {
		if (next.features) selected = next.features;
		if (next.target !== undefined) target = next.target;
		if (next.present !== undefined) present = next.present;
		if (next.active !== undefined) active = next.active;
		if (next.drag !== undefined) drag = next.drag;
		if (next.layout !== undefined) layout = next.layout;
	}
	export function getApi() {
		return {
			get root() {
				return root;
			},
			get input() {
				return input;
			},
			get text() {
				return text;
			},
			get hovered() {
				return hovered;
			},
			get clicked() {
				return clicked;
			},
			retry() {
				errorReset?.();
			}
		};
	}
	untrack(() => onCreate?.(getApi()));
</script>

<svelte:boundary
	onerror={(_error, reset) => {
		errorReset = reset;
	}}
>
	<LazyMotion features={selected} strict>
		{#if present}
			<m.div
				bind:ref={root}
				data-testid="lazy-root"
				initial={initialFalse ? false : 'closed'}
				animate="open"
				variants={{ closed: { x: 0 }, open: () => ({ x: target }) }}
				transition={{ duration: 0.04, ease: 'linear' }}
				{layout}
				style={{ width: 200, height: 180 }}
			>
				<m.input
					bind:ref={input}
					bind:value={text}
					aria-label="Retained input"
					initial={{ opacity: 0.2 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.04 }}
				/>
				<m.span
					data-testid="lazy-inherited"
					variants={{ closed: { opacity: 0.25 }, open: { opacity: 0.75 } }}>Inherited</m.span
				>
				<m.button
					data-testid="lazy-button"
					whileHover={{ scale: 1.2 }}
					onHoverStart={() => hovered++}
					onclick={() => clicked++}>Native button</m.button
				>
				<m.svg width="30" height="30" aria-label="Lazy SVG">
					<m.circle
						data-testid="lazy-circle"
						cx="15"
						cy="15"
						r="5"
						initial={{ pathLength: 0 }}
						animate={{ r: 10, pathLength: 1 }}
						transition={{ duration: 0.04 }}
					/>
				</m.svg>
				<m.div
					data-testid="lazy-drag"
					{drag}
					dragMomentum={false}
					dragConstraints={{ left: 0, right: 50, top: 0, bottom: 0 }}
					style={{ width: 30, height: 30 }}
				/>
			</m.div>
		{/if}
	</LazyMotion>
	{#snippet failed(error)}
		<output data-testid="lazy-error"
			>{error instanceof Error ? error.message : String(error)}</output
		>
	{/snippet}
</svelte:boundary>
