<script lang="ts">
	import { untrack } from 'svelte';
	import LazyMotion from '../motion/LazyMotion.svelte';
	import * as m from '../motion/m/index.js';
	import * as motion from '../motion/elements/index.js';
	import type { FeatureBundle, LazyFeatureBundle } from '../motion/lazy-context.js';
	import type { MotionElement } from '../motion/motion-types.js';
	import Button from './parity-lazy-button.svelte';
	const CustomButton = m.create(Button);
	const CustomElement = m.create('astra-lazy-panel');
	let {
		features,
		mode = 'mixed',
		initialStrict = false,
		initialIgnoreStrict = false
	}: {
		features: FeatureBundle | LazyFeatureBundle;
		mode?: 'mixed' | 'strict' | 'custom';
		initialStrict?: boolean;
		initialIgnoreStrict?: boolean;
	} = $props();
	let strict = $state(untrack(() => initialStrict));
	let ignoreStrict = $state(untrack(() => initialIgnoreStrict));
	let visible = $state(true);
	let label = $state('open');
	let customRef = $state<MotionElement | null>();
	let clicks = $state(0);
	export function configure(next: {
		strict?: boolean;
		ignoreStrict?: boolean;
		visible?: boolean;
		label?: string;
	}) {
		if (next.strict !== undefined) strict = next.strict;
		if (next.ignoreStrict !== undefined) ignoreStrict = next.ignoreStrict;
		if (next.visible !== undefined) visible = next.visible;
		if (next.label !== undefined) label = next.label;
	}
	export function getApi() {
		return {
			get ref() {
				return customRef;
			},
			get clicks() {
				return clicks;
			}
		};
	}
</script>

<svelte:boundary>
	<LazyMotion {features} {strict}>
		{#if mode === 'strict'}
			{#if visible}<motion.div {ignoreStrict} data-testid="eager-strict" />{/if}
		{:else if mode === 'mixed'}
			<m.div
				data-testid="lazy-parent"
				initial="closed"
				animate={label}
				variants={{ closed: { opacity: 0.2 }, open: { opacity: 1 } }}
				transition={{ duration: 0.03 }}
			>
				<motion.div
					data-testid="eager-child"
					variants={{ closed: { x: 0 }, open: { x: 30 } }}
					transition={{ duration: 0.03 }}
				/>
			</m.div>
			<motion.div data-testid="eager-parent" initial="closed" animate={label}>
				<m.div
					data-testid="lazy-child"
					variants={{ closed: { x: 0 }, open: { x: 40 } }}
					transition={{ duration: 0.03 }}
				/>
			</motion.div>
		{:else}
			<CustomButton
				bind:ref={customRef}
				data-testid="lazy-custom"
				onclick={() => clicks++}
				initial={{ opacity: 0.2 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.03 }}>Custom button</CustomButton
			>
			<CustomElement
				data-testid="lazy-element"
				initial={{ x: 0 }}
				animate={{ x: 20 }}
				transition={{ duration: 0.03 }}>Custom element</CustomElement
			>
		{/if}
	</LazyMotion>
	{#snippet failed(error)}<output data-testid="composition-error"
			>{error instanceof Error ? error.message : String(error)}</output
		>{/snippet}
</svelte:boundary>
