<script lang="ts">
	import { createScroll } from '../motion/scroll.svelte.js';
	const windowScroll = createScroll({ reducedMotion: 'never' });
	const fill = windowScroll.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
	export const progress = windowScroll.progress;
</script>

<div
	data-testid="window-scroll-fill"
	{@attach fill}
	style="width:100px;height:4px;transform-origin:left;background:coral"
></div>
