<script lang="ts">
	import AnimatePresence from '../motion/AnimatePresence.svelte';
	import ParityPresenceChild from './ParityPresenceChild.svelte';
	let {
		propagate = false,
		onExit,
		onExitComplete
	}: {
		propagate?: boolean;
		onExit?: (id: string) => void;
		onExitComplete?: () => void;
	} = $props();
	let present = $state(true);
	let releaseInner = () => {};
	export function hide() {
		present = false;
	}
	export function show() {
		present = true;
	}
	export function release() {
		releaseInner();
	}
</script>

<AnimatePresence {present} {onExitComplete}>
	<ParityPresenceChild id="outer" hold={20} {onExit} />
	<AnimatePresence {propagate}>
		<ParityPresenceChild
			id="inner"
			hold={null}
			{onExit}
			capture={(_, complete) => (releaseInner = complete)}
		/>
	</AnimatePresence>
</AnimatePresence>
