<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import {
		Motion,
		MotionConfig,
		motion,
		motionValue,
		type MotionOptions
	} from '$lib/motion/index.js';
	let target = $state({ x: 40 });
	let overridden = $state(true);
	const flat = $derived(overridden ? target : undefined);
	let style = $state<MotionOptions['style'] | string | null>({ color: 'red', width: 80 });
	let disabled = $state<boolean | null | undefined>(true);
	let visible = $state(true);
	let animated = $state(true);
	let baseOpacity = $state(0.4);
	let text = $state<string | null>('original');
	let ref = $state<HTMLButtonElement | null>();
	let clicks = 0;
	let taps = 0;
	let attached = 0;
	let detached = 0;
	const x = motionValue(12);
	const color = motionValue('red');
	let changingStyle = $state<MotionOptions['style']>({ color, x });
	const legacy: MotionOptions = {
		animate: { x: 8 },
		transition: { duration: 2 },
		style: { backgroundColor: 'white', color: 'black' }
	};
	const attachments = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			attached++;
			node.dataset.attached = 'true';
			return () => detached++;
		}
	};
	export const snapshot = () => ({ ref, clicks, taps, attached, detached, text, x, color });
	export function paintValue(next: typeof changingStyle) {
		changingStyle = next;
	}
	export function mutate() {
		target.x = 90;
	}
	export function fallback() {
		overridden = false;
	}
	export function paint(next: typeof style) {
		style = next;
	}
	export function gate(value: typeof disabled) {
		disabled = value;
	}
	export function releaseAnimation() {
		animated = false;
	}
	export function changeBase() {
		baseOpacity = 0.6;
	}
	export function show(value: boolean) {
		visible = value;
	}
</script>

<MotionConfig reducedMotion="never">
	<motion.div
		data-testid="flat"
		motion={legacy}
		initial={false}
		animate={flat}
		transition={{ duration: 0 }}
		{style}
	/>
	<Motion
		data-testid="generic-flat"
		as="article"
		initial={false}
		animate={flat}
		transition={{ duration: 0 }}
		style={{ x, color: 'purple' }}
	/>
	<motion.div data-testid="value-style" style={{ x }} />
	<motion.div data-testid="changing-style" style={changingStyle} />
	<motion.div
		data-testid="return-style"
		initial={false}
		animate={animated ? { opacity: 1 } : undefined}
		style={{ opacity: baseOpacity }}
		transition={{ duration: 0 }}
	/>
	<motion.div
		initial="hidden"
		animate="shown"
		variants={{ hidden: {}, shown: {} }}
		transition={{ duration: 0 }}
	>
		<motion.span
			data-testid="inherited-flat"
			variants={{ hidden: { opacity: 0.2 }, shown: { opacity: 1 } }}
			transition={{ duration: 0 }}>Inherited</motion.span
		>
	</motion.div>
	<form>
		<motion.input
			aria-label="Flat input"
			bind:value={text}
			initial={false}
			animate={{ opacity: 1 }}
		/>
		{#if visible}
			<motion.button
				data-testid="flat-button"
				type="button"
				{...attachments}
				bind:ref
				{disabled}
				motion={{ disabled: true }}
				initial={false}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2, ease: 'linear' }}
				whileTap={{ scale: 0.9 }}
				onTap={() => taps++}
				onclick={() => clicks++}>Native button</motion.button
			>
		{/if}
		<motion.button
			data-testid="legacy-disabled"
			type="button"
			motion={{ disabled: true }}
			onclick={() => clicks++}>Legacy gesture gate</motion.button
		>
	</form>
</MotionConfig>
