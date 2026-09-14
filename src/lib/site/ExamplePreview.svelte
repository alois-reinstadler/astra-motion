<script lang="ts">
	import { MotionConfig } from '$lib/motion/index.js';
	import type { LiveExample } from './examples.js';
	let { example }: { example: LiveExample } = $props();
</script>

<MotionConfig reducedMotion="user">
	<example.component />
</MotionConfig>
