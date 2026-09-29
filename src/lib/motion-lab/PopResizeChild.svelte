<script lang="ts">
	import { presenceRoot, usePresence } from '../motion/presence-context.svelte.js';
	let { complete }: { complete: (callback: () => void) => void } = $props();
	const root = presenceRoot();
	const presence = usePresence();
	function captureRemoval() {
		if (!presence.isPresent) complete(presence.safeToRemove);
	}
	$effect(captureRemoval);
</script>

<p data-pop-resize-text {@attach root}>
	A paragraph with enough words to wrap across several lines when its containing card narrows during
	the same update that starts its exit.
</p>
