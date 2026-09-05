<script lang="ts">
	import { createMotion } from '../motion/motion.svelte.js';
	import { motionValue } from '../motion/values.js';
	let open = $state(true);
	let changed = $state(false);
	let shown = $state(false);
	let custom = $state(20);
	let reduced = $state(false);
	let gestureEnabled = $state(false);
	let gestureDisabled = $state(false);
	let gestureOpen = $state(true);
	const x = motionValue(0);
	const card = createMotion(() => ({
		initial: { opacity: 0, scale: 0.6, y: -20 },
		animate: changed
			? { opacity: [null, 0.7, 1], scale: 0.9, y: 0 }
			: { opacity: 1, scale: 1, y: 0 },
		exit: { opacity: 0, scale: 0.85, y: 35 },
		layout: true,
		reducedMotion: reduced ? 'always' : 'never',
		transition: { duration: 0.3, ease: 'linear' }
	}));
	const presence = card.transition;
	const valueBinding = createMotion({ style: { x }, initial: false });
	const customBinding = createMotion(() => ({
		initial: false,
		animate: 'shown',
		custom,
		variants: { shown: (value: unknown) => ({ x: Number(value) }) },
		transition: { duration: 0.1 }
	}));
	const parent = createMotion(() => ({
		initial: 'hidden',
		animate: shown ? 'visible' : 'hidden',
		variants: { hidden: { opacity: 0.5 }, visible: { opacity: 1 } },
		transition: {
			duration: 0.1,
			when: 'beforeChildren',
			delayChildren: 0.03,
			staggerChildren: 0.12
		}
	}));
	const child = createMotion({
		variants: { hidden: { x: 0 }, visible: { x: 50 } },
		transition: { duration: 0.1 }
	});
	const secondChild = createMotion({
		variants: { hidden: { x: 0 }, visible: { x: 50 } },
		transition: { duration: 0.1 }
	});
	const gesture = createMotion(() => ({
		initial: false,
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0 },
		whileHover: gestureEnabled ? { scale: 1.2 } : undefined,
		disabled: gestureDisabled,
		transition: { duration: 0.1 }
	}));
	const gesturePresence = gesture.transition;
	const incomingGesture = createMotion({
		initial: { opacity: 0, scale: 0.7 },
		animate: { opacity: 1, scale: 1 },
		whileHover: { scale: 1.2 },
		transition: { duration: 0.7, ease: 'linear' }
	});
	const incomingPresence = incomingGesture.transition;
	export function externalValue() {
		return x;
	}
	export function setExternal(value: number) {
		x.set(value);
	}
</script>

<button onclick={() => (open = !open)}>Toggle motion state</button>
<button onclick={() => (changed = !changed)}>Change motion state</button>
<button onclick={() => (shown = !shown)}>Toggle inherited variant</button>
<button onclick={() => (custom += 20)}>Change variant custom</button>
<button onclick={() => (reduced = !reduced)}>Toggle reduced state</button>
<button onclick={() => (gestureEnabled = !gestureEnabled)}>Toggle gesture availability</button>
<button onclick={() => (gestureDisabled = !gestureDisabled)}>Toggle gesture disabled</button>
<button onclick={() => (gestureOpen = !gestureOpen)}>Toggle gesture owner</button>
<div class="track" style:justify-content={changed ? 'flex-end' : 'flex-start'}>
	{#if open}
		<div data-testid="motion-state" {...card.props} transition:presence class="item"></div>
	{/if}
</div>
<div data-testid="motion-value" {...valueBinding.props} class="item"></div>
<div data-testid="motion-custom" {...customBinding.props} class="item"></div>
<div data-testid="motion-parent" {...parent.props}>
	<div data-testid="motion-child" {...child.props} class="item"></div>
	<div data-testid="motion-second-child" {...secondChild.props} class="item"></div>
</div>
{#if gestureOpen}<div
		data-testid="motion-gesture"
		{...gesture.props}
		transition:gesturePresence
		class="item"
	></div>{/if}

<div
	data-testid="incoming-gesture"
	{...incomingGesture.props}
	transition:incomingPresence
	class="item"
></div>

<style>
	.track {
		display: flex;
		width: 400px;
		height: 100px;
	}
	.item {
		width: 100px;
		height: 100px;
		background: royalblue;
	}
</style>
