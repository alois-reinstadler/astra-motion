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
	import { createPresenceScope, providePresenceScope } from './presence-context.svelte.js';
	import { provideActivityContext, type ActivityPhase } from './activity-context.svelte.js';
	import { provideActivityState, readActivityState } from './activity-scope.js';
	import { popPresenceNodes } from './presence-pop.js';
	import { readMotionConfig } from './config.js';

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
	let phase = $state<ActivityPhase>(untrack(() => (mode === 'hidden' ? 'hidden' : 'visible')));
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
			isPresent: mode === 'visible',
			initial: !initial || mode === 'hidden' ? false : undefined,
			custom
		})),
		(generation) => {
			if (!alive || scope.snapshot.isPresent || scope.snapshot.generation !== generation) return;
			const completedExit = phase === 'exiting';
			phase = 'hidden';
			restorePop?.();
			restorePop = undefined;
			if (completedExit) onExitComplete?.();
		}
	);
	providePresenceScope(scope);
	// Only the first mounted subtree inherits initial=false. Later descendants
	// can enter, including those introduced while this retained boundary is hidden.
	onMount(() => {
		queueMicrotask(() => scope.releaseInitial());
	});
	// The retained phase changes after async exit completion, not solely with mode.
	function updateActivity() {
		const present = mode === 'visible';
		const data = custom;
		const pop = layoutMode === 'pop';
		const options = {
			anchorX,
			anchorY,
			root,
			nonce: nonce ?? (config() as { nonce?: string }).nonce
		};
		untrack(() => {
			if (present) {
				phase = 'visible';
				restorePop?.();
				restorePop = undefined;
			} else if (phase !== 'hidden') {
				phase = 'exiting';
				if (pop && !restorePop) restorePop = popPresenceNodes(scope.nodes, options);
			}
			if (!pop) {
				restorePop?.();
				restorePop = undefined;
			}
			scope.update(present, data);
		});
	}
	$effect.pre(updateActivity);
	onDestroy(() => {
		alive = false;
		scope.destroy();
		restorePop?.();
	});
</script>

<svelte:element
	this={tag}
	{...attributes}
	bind:this={ref}
	style={`${style ?? ''};display:${phase === 'hidden' ? 'none' : 'contents'}`}
	inert={mode === 'hidden' || attributes.inert}
	data-astra-activity={phase}
>
	{@render children()}
</svelte:element>
