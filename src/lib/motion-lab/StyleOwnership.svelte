<script lang="ts" module>
	export type StyleSurface = 'flat' | 'generic' | 'legacy' | 'native';
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Motion, motion, createMotion, type MotionOptions } from '../motion/index.js';
	type Style = NonNullable<MotionOptions['style']>;
	let {
		surface = 'flat',
		initialStyle = { color: 'red', width: 50, '--tone': 1 },
		initial,
		animate,
		transition = { duration: 0 },
		layout = false
	}: {
		surface?: StyleSurface;
		initialStyle?: Style;
		initial?: MotionOptions['initial'];
		animate?: MotionOptions['animate'];
		transition?: MotionOptions['transition'];
		layout?: MotionOptions['layout'];
	} = $props();
	let style = $state<Style>(untrack(() => initialStyle));
	const options = (): MotionOptions => ({
		style,
		initial,
		animate,
		transition,
		layout,
		reducedMotion: 'never'
	});
	const binding = createMotion(options);
	export function mutate(next: Style) {
		Object.assign(style, next);
	}
	export function replace(next: Style) {
		style = next;
	}
	export function remove(...keys: (keyof Style)[]) {
		for (const key of keys) delete style[key];
	}
</script>

{#if surface === 'flat'}
	<motion.div data-testid="styled" {...options()} />
{:else if surface === 'generic'}
	<Motion data-testid="styled" {...options()} />
{:else if surface === 'legacy'}
	<motion.div data-testid="styled" motion={options()} />
{:else}
	<div data-testid="styled" {...binding.props}></div>
{/if}
