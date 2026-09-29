<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ActivityMode } from './activity-context.svelte.js';
	import type { PresencePopOptions } from './presence-pop.js';

	export type ActivityTag =
		| 'div'
		| 'span'
		| 'section'
		| 'article'
		| 'aside'
		| 'main'
		| 'nav'
		| 'ul'
		| 'ol'
		| 'li'
		| 'tbody'
		| 'thead'
		| 'tfoot'
		| 'tr'
		| 'td'
		| 'th';
	export type AnimateActivityProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
		PresencePopOptions & {
			mode?: ActivityMode;
			layoutMode?: 'preserve' | 'pop';
			as?: ActivityTag;
			initial?: boolean;
			custom?: unknown;
			onExitComplete?: () => void;
			ref?: HTMLElement;
			children: Snippet;
		};
</script>

<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import {
		createPresenceScope,
		providePresenceScope,
		readPresenceScope
	} from './presence-context.svelte.js';
	import { provideActivityContext, type ActivityPhase } from './activity-context.svelte.js';
	import { provideActivityState, readActivityState } from './activity-scope.js';
	import { popPresenceNodes } from './presence-pop.js';
	import { readMotionConfig } from './config.js';
	import { observePresenceBoxes, type PresenceBox } from './presence-measure.js';

	let {
		mode = 'visible',
		layoutMode = 'preserve',
		as = 'div',
		initial = true,
		custom,
		anchorX = 'left',
		anchorY = 'top',
		root,
		nonce,
		onExitComplete,
		ref = $bindable(),
		children,
		style,
		...attributes
	}: AnimateActivityProps = $props();
	const initialTag = untrack(() => as);
	const tag = $derived.by(() => {
		if (as !== initialTag)
			throw new Error(
				'Astra AnimateActivity: as must stay unchanged while preserving child state.'
			);
		return as;
	});
	const parentPresence = readPresenceScope();
	const parentRegistration = parentPresence?.register();
	const present = $derived(mode === 'visible' && (parentPresence?.snapshot.isPresent ?? true));
	let phase = $state<ActivityPhase>(untrack(() => (present ? 'visible' : 'hidden')));
	function completeParent() {
		if (parentPresence && !parentPresence.snapshot.isPresent)
			parentRegistration?.complete(parentPresence.snapshot.generation);
	}
	let alive = true;
	let restorePop: (() => void) | undefined;
	const config = readMotionConfig();
	const localActive = $derived(phase !== 'hidden');
	provideActivityState(() => localActive);
	const isActive = readActivityState();
	provideActivityContext({
		get mode() {
			return mode;
		},
		get phase() {
			return phase;
		},
		get active() {
			return isActive();
		}
	});
	const scope = createPresenceScope(
		untrack(() => ({
			isPresent: present,
			initial: !initial || !present ? false : undefined,
			custom
		})),
		(generation) => {
			if (!alive || scope.snapshot.isPresent || scope.snapshot.generation !== generation) return;
			const completedExit = phase === 'exiting';
			phase = 'hidden';
			restorePop?.();
			restorePop = undefined;
			completeParent();
			if (completedExit) onExitComplete?.();
		}
	);
	providePresenceScope(scope);
	const boxes = new WeakMap<HTMLElement, PresenceBox>();
	function trackPopBoxes() {
		if (layoutMode !== 'pop' || !present) return;
		// Reading the registrations also refreshes display:contents roots as children mount.
		const nodes = [...scope.nodes];
		const roots = ref ? [ref] : nodes;
		return untrack(() => observePresenceBoxes(roots, boxes, () => present && !restorePop));
	}
	$effect(trackPopBoxes);
	// Only the first mounted subtree inherits initial=false. Later descendants
	// can enter, including those introduced while this retained boundary is hidden.
	onMount(() => {
		queueMicrotask(() => scope.releaseInitial());
		return ref ? parentPresence?.registerNode(ref) : undefined;
	});
	// The retained phase changes after async exit completion, not solely with mode.
	function updateActivity() {
		const isPresent = present;
		// A new parent exit must also release already-hidden retained boundaries.
		const parentGeneration = parentPresence?.snapshot.generation;
		const data = custom;
		const pop = layoutMode === 'pop';
		const options = {
			anchorX,
			anchorY,
			root,
			nonce: nonce ?? (config() as { nonce?: string }).nonce
		};
		untrack(() => {
			if (isPresent) {
				phase = 'visible';
				restorePop?.();
				restorePop = undefined;
			} else if (phase !== 'hidden') {
				phase = 'exiting';
				if (pop && !restorePop)
					restorePop = popPresenceNodes(ref ? [ref] : scope.nodes, options, boxes);
			}
			if (!pop) {
				restorePop?.();
				restorePop = undefined;
			}
			scope.update(isPresent, data);
			if (phase === 'hidden' && parentGeneration !== undefined) completeParent();
		});
	}
	$effect.pre(updateActivity);
	onDestroy(() => {
		alive = false;
		scope.destroy();
		parentRegistration?.unregister();
		restorePop?.();
	});
</script>

<svelte:element
	this={tag}
	{...attributes}
	bind:this={ref}
	style={`${style ?? ''};display:${phase === 'hidden' ? 'none' : 'contents'}`}
	inert={!present || attributes.inert}
	data-astra-activity={phase}
>
	{@render children()}
</svelte:element>
