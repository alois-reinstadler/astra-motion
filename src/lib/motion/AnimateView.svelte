<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { ViewAnimationOptions, ViewTransition } from './view-types.js';

	export type AnimateViewProps = ViewAnimationOptions & {
		children: Snippet<[Attachment<HTMLElement | SVGElement>]>;
	};
</script>

<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { readActivityState } from './activity-scope.js';
	import { readPresenceScope } from './presence-context.svelte.js';
	import { observeMotionConfig, observeMotionPreference, readMotionConfig } from './config.js';
	import { shouldReduceMotion } from './policy.js';
	import { createViewIdentity, registerViewParticipant } from './view-registry.js';
	import { releaseViewOwner, skipViewTransitions } from './view-transitions.js';

	let { children, ...props }: AnimateViewProps = $props();
	const { id, owner } = createViewIdentity();
	const config = readMotionConfig();
	const presence = readPresenceScope();
	const active = readActivityState();
	const documents: Document[] = [];
	const options = (): ViewAnimationOptions => ({
		reducedMotion: 'never',
		...config(),
		// Shared MotionConfig has a wider animation contract. The native View adapter
		// validates inherited timing exactly like direct JavaScript options.
		transition: config().transition as ViewTransition | undefined,
		...Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined))
	});
	const attach: Attachment<HTMLElement | SVGElement> = (node) => {
		if (!documents.includes(node.ownerDocument)) documents.push(node.ownerDocument);
		return registerViewParticipant({
			id,
			owner,
			node,
			options,
			isActive: () => active() && (presence?.snapshot.isPresent ?? true)
		});
	};
	let reduced = untrack(() => shouldReduceMotion(options()));
	function checkPolicy() {
		const next = shouldReduceMotion(options());
		if (next && !reduced) for (const document of documents) skipViewTransitions(document);
		reduced = next;
	}
	$effect(checkPolicy);
	function observePolicy() {
		const preference = observeMotionPreference(checkPolicy);
		const configuration = observeMotionConfig(config, checkPolicy);
		return () => {
			preference();
			configuration();
		};
	}
	onMount(observePolicy);
	onDestroy(() => {
		for (const document of documents) releaseViewOwner(document, owner);
	});
</script>

{@render children(attach)}
