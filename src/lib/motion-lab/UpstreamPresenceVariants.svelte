<!-- Adapted from Motion v13.4.4 scenarios; see tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { AnimatePresence, motion } from '../motion/index.js';
	let {
		scenario,
		onExitComplete
	}: {
		scenario: 'variants' | 'race' | 'rapid' | 'group';
		onExitComplete?: () => void;
	} = $props();
	let label = $state('hidden');
	let late = $state(false);
	let present = $state(true);
	let mode = $state('bar');
	const variants = { hidden: { x: -100 }, visible: { x: 100 } };
	export function show() {
		label = 'visible';
	}
	export function addChild() {
		late = true;
	}
	export function selectVariant(next: string) {
		label = next;
	}
	export function selectMode(next: string) {
		mode = next;
	}
	export function setPresent(next: boolean) {
		present = next;
	}
</script>

{#if scenario === 'variants'}
	<motion.div
		data-upstream="parent"
		initial="hidden"
		animate={label}
		{variants}
		transition={{ duration: 0.1 }}
	>
		<motion.div data-upstream="inherited" {variants} transition={{ duration: 0.1 }} />
		<motion.div
			data-upstream="override"
			animate="hidden"
			{variants}
			transition={{ duration: 0.1 }}
		/>
		<motion.div>
			{#if late}
				<motion.div data-upstream="late" {variants} transition={{ duration: 0.15 }} />
			{/if}
		</motion.div>
	</motion.div>
{:else if scenario === 'race'}
	<motion.div
		data-upstream="race"
		initial="hidden"
		animate={label}
		variants={{
			visible: { opacity: 1, transition: { type: false }, transitionEnd: { display: 'flex' } },
			hidden: { opacity: 0.5, display: 'none', transition: { type: false } }
		}}
		style={{ display: 'none' }}
	/>
{:else if scenario === 'rapid'}
	<AnimatePresence
		items={[mode]}
		key={(item) => item}
		initial={false}
		mode="popLayout"
		{onExitComplete}
	>
		{#snippet children(item)}
			<motion.div
				data-upstream={item}
				initial={{ opacity: 0, scale: 0 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0 }}
				transition={{ duration: 0 }}
			/>
		{/snippet}
	</AnimatePresence>
{:else}
	<AnimatePresence {present} initial={false} {onExitComplete}>
		<div data-upstream="group">
			<motion.div
				data-upstream="fast"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, transition: { duration: 0.05 } }}
				transition={{ duration: 0.05 }}
			/>
			<motion.div
				data-upstream="slow"
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, transition: { duration: 10 } }}
			/>
		</div>
	</AnimatePresence>
{/if}
