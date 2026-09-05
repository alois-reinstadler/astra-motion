<script lang="ts">
	import type { Snippet } from 'svelte';
	import { provideMotionConfig, type MotionConfigOptions } from './config.js';
	let { children, ...options }: MotionConfigOptions & { children: Snippet } = $props();
	const notify = provideMotionConfig(() => options);
	$effect(notify);
</script>

{@render children()}
