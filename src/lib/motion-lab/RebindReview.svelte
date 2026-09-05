<script lang="ts">
	import { untrack } from 'svelte';
	import { createMotion } from '../motion/lite.svelte.js';
	import type { Attachment } from 'svelte/attachments';
	let {
		native = false,
		initial = false,
		lateTarget = 0
	}: { native?: boolean; initial?: boolean; lateTarget?: number } = $props();
	let revision = $state(0);
	let x = $state(0);
	let open = $state(true);
	const motion = createMotion(() => ({
		initial: initial ? { x: -80, opacity: 0 } : false,
		animate: { x, opacity: 1 },
		exit: { x: -80, opacity: 0 },
		transition: { duration: 0.5, ease: 'linear' },
		reducedMotion: 'never'
	}));
	// Intentionally change after construction to probe style resolution at markup/SSR time.
	x = untrack(() => lateTarget);
	const nativeTransition = motion.transition;
	const attachment = motion.props[Object.getOwnPropertySymbols(motion.props)[0]];
	let attached: HTMLElement | undefined;
	let detach: void | (() => void);
	let attachmentRuns = 0;
	const reconnect: Attachment<HTMLElement> = (node) => {
		void revision;
		attached = node;
		attachmentRuns++;
		detach = attachment(node);
		return () => {
			detach?.();
			attached = undefined;
		};
	};
	export function runs() {
		return attachmentRuns;
	}
	export function forceRebind() {
		if (!attached) return;
		detach?.();
		attachmentRuns++;
		detach = attachment(attached);
	}
	export function change(next: number) {
		x = next;
	}
	export function rebind() {
		revision++;
	}
	export function show(next: boolean) {
		open = next;
	}
</script>

{#if open}
	{#if native}
		<div
			data-review-rebind
			style={motion.props.style}
			{@attach reconnect}
			transition:nativeTransition|global
		>
			Native rebind
		</div>
	{:else}
		<div data-review-rebind style={motion.props.style} {@attach reconnect}>State rebind</div>
	{/if}
{/if}
