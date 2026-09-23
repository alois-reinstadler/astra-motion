<script lang="ts">
	import type { Snippet } from 'svelte';
	import { routeTransitions } from 'astra-motion/routes';
	let { children }: { children: Snippet } = $props();
	routeTransitions({ reducedMotion: 'never', onDiagnostic: (message) => console.warn(message) });
</script>

{@render children()}
