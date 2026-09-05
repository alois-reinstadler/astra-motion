<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	import { popLayout } from '../motion/presence.js';
	import type { LayoutController } from '../motion/layout.js';
	let { value, layout }: { value: string; layout: LayoutController } = $props();
	const parent = createMotion(() => ({
		initial: false,
		animate: 'visible',
		exit: 'hidden',
		variants: { visible: { opacity: 1 }, hidden: { opacity: 0.2 } },
		transition: { duration: 0.15, when: 'afterChildren', staggerChildren: 0.08 },
		layout: { id: 'review-shared' },
		layoutGroup: layout,
		reducedMotion: 'never'
	}));
	const child = parent.child({
		variants: { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 15 } },
		transition: { duration: 0.2 },
		layout: { mode: 'position' },
		reducedMotion: 'never'
	});
	const parentTransition = parent.transition;
	const childTransition = child.transition;
</script>

<article
	data-review-composed={value}
	{...parent.props}
	style="{parent.props.style};padding:10px;width:180px;height:70px;background:gray"
	{@attach popLayout()}
	transition:parentTransition|global
>
	<p {...child.props} data-review-composed-child transition:childTransition|global>{value}</p>
</article>
