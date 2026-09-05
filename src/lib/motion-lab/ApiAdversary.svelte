<script lang="ts">
	import { untrack } from 'svelte';
	import { createMotion, type MotionOptions } from '../motion/motion.svelte.js';
	import Card from '../components/ui/card/card.svelte';
	let {
		reducedInitially = false,
		childNever = false,
		domInferred = false
	}: { reducedInitially?: boolean; childNever?: boolean; domInferred?: boolean } = $props();
	let moved = $state(false);
	let reduced = $state(false);
	let enabled = $state(false);
	let blue = $state(false);
	let completions = 0;
	const parent = createMotion(() => ({
		initial: false,
		animate: moved ? 'moved' : 'ready',
		reducedMotion: reducedInitially || reduced ? 'always' : 'never',
		variants: { ready: { opacity: 1 }, moved: { opacity: 1 } }
	}));
	const childOptions = (): MotionOptions => ({
		variants: { ready: { x: 0 }, moved: { x: 120 } },
		reducedMotion: childNever ? 'never' : reducedInitially || reduced ? 'always' : 'never',
		transition: { duration: 0.6, ease: 'linear' },
		onAnimationComplete: () => {
			completions++;
		}
	});
	const child = untrack(() => domInferred)
		? createMotion(childOptions)
		: parent.child(childOptions);
	const movingCard = createMotion(() => ({
		initial: false,
		animate: { x: moved ? 120 : 0 },
		transition: { duration: 0.2 }
	}));
	const card = createMotion({ initial: false, animate: { opacity: 1 } });
	export function completed() {
		return completions;
	}
	export function move() {
		moved = true;
	}
	export function reduce() {
		reduced = true;
	}
	export function recolor() {
		blue = true;
	}
	export function enable() {
		enabled = true;
	}
</script>

<section {...parent.props}>
	<div {...child.props} data-api-child>Inherited child</div>
</section>
<Card motion={enabled ? card : undefined}>
	<input aria-label="Draft name" value="Keep this draft" />
</Card>

<Card motion={movingCard} style={`background-color:${blue ? 'blue' : 'red'}`} data-api-styled-card
	>Styled card</Card
>
