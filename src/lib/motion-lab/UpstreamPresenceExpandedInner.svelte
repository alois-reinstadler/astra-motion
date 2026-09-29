<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { presenceRoot, usePresence, usePresenceData } from '../motion/index.js';
	let {
		id,
		capture,
		css = ''
	}: { id: string; capture: (id: string, remove: () => void) => void; css?: string } = $props();
	const state = usePresence();
	const data = usePresenceData();
	const root = presenceRoot();
	function captureExit() {
		if (!state.isPresent) untrack(() => capture(id, state.safeToRemove));
	}
	$effect(captureExit);
</script>

<div data-expanded-manual={id} {@attach root} style={css}>{id}:{String(data.current)}</div>
