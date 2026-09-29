<script lang="ts">
	import { untrack } from 'svelte';
	import TextReveal from '../motion/TextReveal.svelte';
	import TextSwap from '../motion/TextSwap.svelte';
	import MotionConfig from '../motion/MotionConfig.svelte';
	import AnimateActivity from '../motion/AnimateActivity.svelte';
	import type { TextSwapProps, TextRevealProps } from '../motion/text-types.js';
	import type { ReducedMotion } from '../motion/policy.js';
	let {
		mode = 'sync',
		size = 'reserve',
		trigger = 'state',
		once = true,
		duration = 0.12,
		stagger = 0,
		initialPolicy = 'never'
	}: {
		mode?: TextSwapProps['mode'];
		size?: TextSwapProps['size'];
		trigger?: TextRevealProps['trigger'];
		once?: boolean;
		duration?: number;
		stagger?: number;
		initialPolicy?: ReducedMotion;
	} = $props();
	let text = $state('Alpha message.');
	let visible = $state(true);
	let policy = $state<ReducedMotion>(untrack(() => initialPolicy));
	let activity = $state<'visible' | 'hidden'>('visible');
	let width = $state(260);
	let font = $state(18);
	const alternatives = [
		'Alpha message.',
		'Beta message that wraps across several lines at narrow widths.',
		'Gamma.'
	];
	export function select(value: string) {
		text = value;
	}
	export function show(value: boolean) {
		visible = value;
	}
	export function reduce(value: ReducedMotion) {
		policy = value;
	}
	export function hide(value: boolean) {
		activity = value ? 'hidden' : 'visible';
	}
	export function resize(value: number) {
		width = value;
	}
	export function fontSize(value: number) {
		font = value;
	}
</script>

<MotionConfig reducedMotion={policy}>
	<AnimateActivity mode={activity} data-text-activity>
		<div style:width={`${width}px`} style:font-size={`${font}px`}>
			<TextReveal
				data-reveal
				as="h2"
				text="Hello 👨‍👩‍👧‍👦 é!"
				split="graphemes"
				effect="blur"
				{trigger}
				{visible}
				{once}
				{duration}
				{stagger}
			/>
			<button style="font: inherit; max-width: 100%" data-control
				><TextSwap
					data-swap
					{text}
					{mode}
					{size}
					{alternatives}
					effect="slide"
					split="words"
					{duration}
					{stagger}
					style={size === 'fixed' ? 'width:180px;height:90px' : 'display:block'}
				/></button
			>
			<input data-retained aria-label="Retained input" />
		</div>
	</AnimateActivity>
</MotionConfig>
