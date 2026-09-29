<script lang="ts" generics="T">
	import { onDestroy, onMount, untrack, type Snippet } from 'svelte';
	import { createPresenceScope, providePresenceScope } from './presence-context.svelte.js';
	import { popPresenceNodes, type PresencePopOptions } from './presence-pop.js';
	import type { PresenceEntry } from './presence-model.js';
	import { layoutBridge } from './commit.js';
	import { observePresenceBoxes, type PresenceBox } from './presence-measure.js';

	let {
		entry,
		custom,
		presenceAffectsLayout,
		pop = false,
		popOptions,
		onComplete,
		children
	}: {
		entry: PresenceEntry<T>;
		custom: unknown;
		presenceAffectsLayout: boolean;
		pop?: boolean;
		popOptions: PresencePopOptions;
		onComplete: (token: symbol) => void;
		children: Snippet<[T]>;
	} = $props();
	const scope = createPresenceScope(
		untrack(() => ({ isPresent: entry.isPresent, initial: entry.initial, custom })),
		() => onComplete(entry.token)
	);
	providePresenceScope(scope);
	// Suppress only the boundary's initial children, including hydration. Later
	// descendants under this same retained record can run their own entrances.
	onMount(() => {
		queueMicrotask(() => scope.releaseInitial());
	});
	let restorePop: (() => void) | undefined;
	const boxes = new WeakMap<HTMLElement, PresenceBox>();
	function trackPopBoxes() {
		if (!pop || !entry.isPresent) return;
		const nodes = [...scope.nodes];
		return untrack(() => observePresenceBoxes(nodes, boxes, () => entry.isPresent && !restorePop));
	}
	$effect(trackPopBoxes);
	function updatePresence() {
		const present = entry.isPresent;
		const data = custom;
		const shouldPop = pop;
		const options = popOptions;
		const affectsLayout = presenceAffectsLayout;
		void entry;
		untrack(() => {
			if (!present && shouldPop && !restorePop)
				restorePop = popPresenceNodes(scope.nodes, options, boxes);
			if (present || !shouldPop) {
				restorePop?.();
				restorePop = undefined;
			}
			scope.update(present, data);
			if (affectsLayout) layoutBridge.invalidate?.(scope.nodes);
		});
	}
	$effect.pre(updatePresence);
	onDestroy(() => {
		scope.destroy();
		restorePop?.();
	});
</script>

{@render children(entry.value)}
