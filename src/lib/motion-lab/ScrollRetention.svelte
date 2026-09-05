<script lang="ts">
	import MotionConfig from '../motion/MotionConfig.svelte';
	import ScrollRetained from './ScrollRetained.svelte';
	let open = $state(true);
	let reduced = $state(false);
	export function update(next: { open?: boolean; reduced?: boolean }) {
		if (next.open !== undefined) open = next.open;
		if (next.reduced !== undefined) reduced = next.reduced;
	}
</script>

<button onclick={() => (open = false)}>Remove scrolling child</button>
<button onclick={() => (reduced = true)}>Reduce scrolling child</button>
<MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
	{#if open}<ScrollRetained />{/if}
</MotionConfig>
