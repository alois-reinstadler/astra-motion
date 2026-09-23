<script lang="ts">
	import { createMotion } from 'astra-motion';
	let { kind }: { kind: string } = $props();
	const binding = createMotion({ initial: { opacity: 0.2 }, animate: { opacity: 1 } });
	const enterExit = binding.transition;
</script>

{#if kind === 'repeat'}
	{#each [1, 2] as id (id)}<div {...binding.props}>{id}</div>{/each}
{:else if kind === 'css'}<div class="transformed" {...binding.props}>
		Opacity only with authored transform
	</div>
{:else}<div id="member" {...binding.props} transition:enterExit>Direct member transition</div>{/if}

<style>
	.transformed {
		transform: translateX(20px);
	}
</style>
