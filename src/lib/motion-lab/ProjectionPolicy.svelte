<script lang="ts">
	import { untrack } from 'svelte';
	import { createMotionWithFeatures } from '../motion/motion-core.svelte.js';
	import {
		createLayout,
		updateLayout,
		type LayoutOptions,
		type LayoutGroupOptions
	} from '../motion/layout.js';
	let { enabled = true, shared = false }: { enabled?: boolean; shared?: boolean } = $props();
	let layout = $state(untrack(() => enabled));
	let duration = $state(1);
	let automatic = $state(false);
	let reduced = $state(false);
	let shifted = $state(false);
	let creates = 0;
	let attaches = 0;
	let releases = 0;
	const group = untrack(() => (shared ? createLayout({ automatic: false }) : undefined));
	function instrumentedLayout(options?: LayoutGroupOptions) {
		creates++;
		const controller = createLayout(options);
		return Object.assign(
			(config?: LayoutOptions) => (element: HTMLElement) => {
				attaches++;
				const release = controller(config)(element);
				return () => {
					releases++;
					release?.();
				};
			},
			{ update: controller.update, stats: controller.stats }
		);
	}
	const binding = createMotionWithFeatures(
		() => ({
			initial: false,
			layout: layout ? { style: { rotate: 0 } } : false,
			layoutGroup: group,
			transition: { duration, ease: 'linear' },
			automatic,
			reducedMotion: reduced ? 'always' : 'never'
		}),
		{ layout: { create: instrumentedLayout, update: updateLayout } }
	);
	export const counts = () => ({ creates, attaches, releases });
	export function setDuration(value: number) {
		duration = value;
	}
	export function setLayout(value: boolean) {
		layout = value;
	}
	export function setAutomatic(value: boolean) {
		automatic = value;
	}
	export function reduce() {
		reduced = true;
	}
	export function move(transaction = true) {
		if (transaction) binding.update(() => (shifted = !shifted));
		else shifted = !shifted;
	}
</script>

<div style="display: flex; width: 400px; justify-content: {shifted ? 'end' : 'start'}">
	<div data-testid="projection-policy" {...binding.props}></div>
</div>

<style>
	[data-testid='projection-policy'] {
		width: 40px;
		height: 40px;
		background: royalblue;
	}
</style>
