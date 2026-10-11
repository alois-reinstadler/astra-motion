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
		hold,
		onRead,
		onComplete,
		onCancel
	}: {
		id: string;
		hold: number;
		onRead: (id: string, field: 'presence' | 'isPresent' | 'data') => void;
		onComplete: (id: string) => void;
		onCancel: (id: string) => void;
	} = $props();
	const presence = usePresence();
	// Capture during initialization, while the retained record is still present.
	const remove = presence.safeToRemove;
	const present = useIsPresent();
	const data = usePresenceData<number>();
	const root = presenceRoot();
	function trackPresence() {
		void presence.isPresent;
		untrack(() => onRead(id, 'presence'));
		if (presence.isPresent) return;
		const timer = setTimeout(() => {
			onComplete(id);
			remove();
		}, hold);
		return () => {
			clearTimeout(timer);
			untrack(() => onCancel(id));
		};
	}
	function trackIsPresent() {
		void present.current;
		untrack(() => onRead(id, 'isPresent'));
	}
	function trackData() {
		void data.current;
		untrack(() => onRead(id, 'data'));
	}
	$effect(trackPresence);
	$effect(trackIsPresent);
	$effect(trackData);
</script>

<div data-release-presence={id} {@attach root}>
	<span data-present>{String(presence.isPresent)}</span>
	<span data-custom>{data.current}</span>
</div>
