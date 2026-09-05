<script lang="ts">
	import { createLayout } from '../motion/layout.js';
	import { presence } from '../motion/presence.js';
	const layout = createLayout({ transition: { duration: 0.35 } });
	let expanded = $state(false);
</script>

<button
	data-testid="shared-presence-toggle"
	onclick={() =>
		layout.update(() => {
			expanded = !expanded;
		})}>Swap shared presence</button
>
<div style="position: relative; width: 400px; height: 220px;">
	{#key expanded}
		<div
			data-shared-presence={expanded ? 'detail' : 'card'}
			style:position="absolute"
			style:left={expanded ? '140px' : '0px'}
			style:width={expanded ? '220px' : '100px'}
			style:height={expanded ? '180px' : '100px'}
			style:background={expanded ? 'coral' : 'royalblue'}
			{@attach layout({ id: 'surface' })}
			transition:presence={{ duration: 350 }}
		>
			<span style="display: block" {@attach layout({ mode: 'position' })}>Shared surface</span>
		</div>
	{/key}
</div>
