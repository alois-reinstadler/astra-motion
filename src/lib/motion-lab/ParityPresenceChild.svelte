<script lang="ts">
	import { untrack } from 'svelte';
	import {
		presenceRoot,
		useIsPresent,
		usePresence,
		usePresenceData
	} from '../motion/presence-context.svelte.js';
	let {
		id,
		label = id,
		hold = 40,
		capture,
		onExit
	}: {
		id: string;
		label?: string;
		hold?: number | null;
		capture?: (id: string, complete: () => void) => void;
		onExit?: (id: string) => void;
	} = $props();
	const presence = usePresence();
	const present = useIsPresent();
	const data = usePresenceData<number>();
	const root = presenceRoot();
	const exiting = $derived(!presence.isPresent);
	function waitForExit() {
		if (!exiting) return;
		const done = untrack(() => presence.safeToRemove);
		untrack(() => {
			capture?.(id, done);
			onExit?.(id);
		});
		if (hold === null) return;
		const timer = setTimeout(done, hold);
		return () => clearTimeout(timer);
	}
	$effect(waitForExit);
</script>

<div data-presence-item={id} {@attach root} style="height: 44px; margin: 3px; padding: 2px;">
	<label>{label}<input aria-label={id} /></label>
	<span data-present>{String(present.current)}</span>
	<span data-custom>{data.current}</span>
</div>
