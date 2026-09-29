<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion, LayoutGroup } from '../motion/index.js';
	let {
		id,
		parentId,
		childId,
		inherit = true,
		show = true,
		left = 0,
		bridge = false,
		direct = false
	}: {
		id: string;
		parentId?: string;
		childId?: string;
		inherit?: boolean | 'id';
		show?: boolean;
		left?: number;
		bridge?: boolean;
		direct?: boolean;
	} = $props();
</script>

{#snippet element()}
	{#if show}<motion.div
			data-namespace-box={id}
			layout
			layoutId="namespace-card"
			transition={{ duration: 0.5, ease: (p) => (p < 1 ? 0.5 : 1) }}
			style={{ position: 'absolute', left, top: 0, width: 100, height: 100 }}
		/>{/if}
{/snippet}
<LayoutGroup id={parentId}>
	{#if direct}
		{@render element()}
	{:else if bridge}
		<LayoutGroup><LayoutGroup id={childId} {inherit}>{@render element()}</LayoutGroup></LayoutGroup>
	{:else}
		<LayoutGroup id={childId} {inherit}>{@render element()}</LayoutGroup>
	{/if}
</LayoutGroup>
