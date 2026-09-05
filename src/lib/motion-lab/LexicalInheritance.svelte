<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	let outerChanged = $state(false);
	let middleChanged = $state(false);
	const outer = createMotion(() => ({
		initial: false,
		animate: outerChanged ? 'outerMoved' : 'outerReady',
		variants: { outerReady: { opacity: 1 }, outerMoved: { opacity: 1 } },
		layout: true,
		reducedMotion: 'never'
	}));
	const middle = createMotion(() => ({
		initial: false,
		animate: middleChanged ? 'middleMoved' : 'middleReady',
		variants: { middleReady: { opacity: 1 }, middleMoved: { opacity: 1 } },
		layout: true,
		reducedMotion: 'never'
	}));
	const leaf = outer.child({
		variants: {
			outerReady: { x: [0, 160, 80], opacity: [0.1, 0.4, 1] },
			outerMoved: { x: 120, opacity: 1 },
			middleReady: { x: -80, opacity: 0.2 },
			middleMoved: { x: -120, opacity: 0.3 }
		},
		transition: { duration: 0.25, ease: 'linear' },
		layout: { mode: 'position' },
		reducedMotion: 'never'
	});
	const transition = leaf.transition;
	export function moveOuter() {
		outerChanged = !outerChanged;
	}
	export function moveMiddle() {
		middleChanged = !middleChanged;
	}
</script>

<div class="flex flex-wrap gap-3">
	<button class="rounded-md border px-3 py-2" data-lexical="outer-toggle" onclick={moveOuter}
		>Change declared parent</button
	>
	<button class="rounded-md border px-3 py-2" data-lexical="middle-toggle" onclick={moveMiddle}
		>Change intervening binding</button
	>
</div>
<section {...outer.props} data-lexical="outer" style="{outer.props.style};padding:20px;width:340px">
	<div {...middle.props} data-lexical="middle" style="{middle.props.style};padding:10px">
		<div
			{...leaf.props}
			data-lexical="leaf"
			style="{leaf.props
				.style};width:120px;padding:12px;background:var(--muted);color:var(--foreground);border-radius:8px"
			transition:transition
		>
			Declared child
		</div>
	</div>
</section>
