<script lang="ts">
	import { untrack } from 'svelte';
	import { AnimatePresence, AnimateActivity, MotionConfig, motion } from '../motion/index.js';
	import type { PresenceMode } from '../motion/presence-model.js';
	let {
		initial = true,
		mode = 'sync',
		activity = false,
		initiallyHidden = false,
		onComplete,
		onAnimationStart,
		onAnimationComplete,
		onUpdate
	}: {
		initial?: boolean;
		mode?: PresenceMode;
		activity?: boolean;
		initiallyHidden?: boolean;
		onComplete?: () => void;
		onAnimationStart?: (target: unknown) => void;
		onAnimationComplete?: (target: unknown) => void;
		onUpdate?: (values: Record<string, unknown>) => void;
	} = $props();
	let visible = $state(untrack(() => !initiallyHidden));
	let custom = $state(1);
	let current = $state('a');
	let later = $state(false);
	export function addDescendant() {
		later = true;
	}
	export function show() {
		visible = true;
	}
	export function hide() {
		visible = false;
	}
	export function select(value: string) {
		current = value;
	}
	export function setCustom(value: number) {
		custom = value;
	}
</script>

<button onclick={() => (visible = !visible)}>Toggle managed content</button>
<MotionConfig transition={{ duration: 0.12, ease: 'linear' }}>
	{#if activity}
		<AnimateActivity
			mode={visible ? 'visible' : 'hidden'}
			{initial}
			onExitComplete={onComplete}
			data-managed-activity
		>
			<motion.div
				data-managed-item="activity"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1, rotate: 360 }}
				exit={{ opacity: 0 }}
				transition={{
					opacity: { duration: 0.12 },
					rotate: { repeat: Infinity, duration: 1, ease: 'linear' }
				}}
				{onAnimationStart}
				{onAnimationComplete}
				{onUpdate}
			>
				<input aria-label="Managed draft" />
			</motion.div>
		</AnimateActivity>
	{:else}
		<AnimatePresence
			items={visible ? [current] : []}
			key={(item) => item}
			{mode}
			{initial}
			{custom}
			onExitComplete={onComplete}
		>
			{#snippet children(item)}
				<motion.div
					data-managed-item={item}
					initial="hidden"
					animate="visible"
					exit="leave"
					variants={{
						hidden: { opacity: 0 },
						visible: { opacity: 1, x: 0 },
						leave: (direction) => ({ opacity: 0, x: Number(direction) * 100 })
					}}
					{onAnimationStart}
					{onAnimationComplete}
					{onUpdate}
				>
					{#if later}<motion.span
							data-later-descendant
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.15 }}>Later</motion.span
						>{/if}
					<motion.span
						data-managed-descendant
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18 }}>Retained {item}</motion.span
					>
				</motion.div>
			{/snippet}
		</AnimatePresence>
	{/if}
</MotionConfig>
