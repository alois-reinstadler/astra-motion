<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	let {
		when = 'afterChildren',
		initial = false
	}: {
		when?: 'beforeChildren' | 'afterChildren';
		initial?: false | 'hidden';
	} = $props();
	let open = $state(true);
	let reduced = $state(false);
	const parent = createMotion(() => ({
		initial,
		animate: 'visible',
		exit: 'hidden',
		layout: true,
		reducedMotion: reduced ? 'always' : 'never',
		variants: { visible: { opacity: 1 }, hidden: { opacity: 0.2 } },
		transition: { duration: 0.25, ease: 'linear', when, delayChildren: 0.03, staggerChildren: 0.12 }
	}));
	const first = parent.child(() => ({
		variants: { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } },
		transition: { duration: 0.25, ease: 'linear' },
		reducedMotion: reduced ? 'always' : 'never',
		layout: { mode: 'position' }
	}));
	const second = parent.child(() => ({
		variants: { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } },
		transition: { duration: 0.25, ease: 'linear' },
		reducedMotion: reduced ? 'always' : 'never',
		layout: { mode: 'position' }
	}));
	const parentTransition = parent.transition;
	const firstTransition = first.transition;
	const secondTransition = second.transition;
	export function toggle() {
		open = !open;
	}
	export function reduce() {
		reduced = true;
	}
</script>

{#if open}
	<section
		data-coordinated="parent"
		{...parent.props}
		transition:parentTransition
		style="{parent.props.style};padding:20px;width:300px"
	>
		<p data-coordinated="first" {...first.props} transition:firstTransition>First child</p>
		<p data-coordinated="second" {...second.props} transition:secondTransition>Second child</p>
	</section>
{/if}
