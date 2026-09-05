<script lang="ts">
	import MotionConfig from '../motion/MotionConfig.svelte';
	import ConfigScopeConsumer from './ConfigScopeConsumer.svelte';
	let { report = () => {} }: { report?: (name: string) => void } = $props();
	let reduced = $state(false);
	let duration = $state(1);
	let visible = $state(true);
	export function reduce() {
		reduced = true;
	}
	export function changeTransition() {
		duration = 2;
	}
	export function hide() {
		visible = false;
	}
</script>

<ConfigScopeConsumer name="outside" {report} />
<MotionConfig reducedMotion="never">
	<ConfigScopeConsumer name="sibling" {report} />
</MotionConfig>
<MotionConfig
	reducedMotion={reduced ? 'always' : 'never'}
	transition={{ duration, ease: 'linear' }}
>
	<ConfigScopeConsumer name="inside" {report} />
	{#if visible}
		<MotionConfig automatic={false}>
			<ConfigScopeConsumer name="nested" {report} />
		</MotionConfig>
	{/if}
	{#if visible}
		<MotionConfig reducedMotion="never">
			<ConfigScopeConsumer name="override" {report} />
		</MotionConfig>
	{/if}
</MotionConfig>
