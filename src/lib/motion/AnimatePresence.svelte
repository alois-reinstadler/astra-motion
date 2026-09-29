<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { PresenceKey, PresenceMode } from './presence-model.js';
	import type { PresencePopOptions } from './presence-pop.js';

	export type AnimatePresenceProps<T = undefined> = PresencePopOptions & {
		initial?: boolean;
		mode?: PresenceMode;
		custom?: unknown;
		propagate?: boolean;
		presenceAffectsLayout?: boolean;
		onExitComplete?: () => void;
		children: Snippet<[T]>;
	} & (
			| { present?: boolean; items?: never; value?: never; key?: never }
			| { items: readonly T[]; key: (item: T) => PresenceKey; present?: never; value?: never }
			| {
					/** Display one retained item. Null and undefined render nothing. */
					value: T | null | undefined;
					/** Select stable identity; defaults to the value itself (reference identity for objects). */
					key?: (item: T) => PresenceKey;
					present?: never;
					items?: never;
			  }
		);
</script>

<script lang="ts" generics="T = undefined">
	import { onDestroy, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import AnimatePresenceItem from './AnimatePresenceItem.svelte';
	import { readMotionConfig } from './config.js';
	import { readPresenceScope, type PresenceRegistration } from './presence-context.svelte.js';
	import { reconcilePresence, type PresenceInput } from './presence-model.js';

	let {
		key,
		initial = true,
		mode = 'sync',
		custom,
		propagate = false,
		presenceAffectsLayout = true,
		anchorX = 'left',
		anchorY = 'top',
		root,
		nonce,
		onExitComplete,
		children,
		...form
	}: AnimatePresenceProps<T> = $props();
	const parent = readPresenceScope();
	const configuration = readMotionConfig();
	const conditionalKey = Symbol('conditional-presence');
	function input(): PresenceInput<T>[] {
		const forms = ['present', 'items', 'value'].filter((name) => name in form);
		if (forms.length > 1)
			throw new Error('Astra AnimatePresence: present, items and value are mutually exclusive.');
		if ('items' in form && (!Array.isArray(form.items) || !key))
			throw new Error('Astra AnimatePresence: items requires an array and a stable key function.');
		if (!('items' in form) && !('value' in form) && key)
			throw new Error('Astra AnimatePresence: key requires items or value.');
		if (propagate && parent && !parent.snapshot.isPresent) return [];
		if ('items' in form) return form.items!.map((value) => ({ value, key: key!(value) }));
		if ('value' in form) {
			const value = form.value;
			return value == null ? [] : [{ value, key: key ? key(value) : (value as PresenceKey) }];
		}
		return (form.present ?? true) ? [{ key: conditionalKey, value: undefined as T }] : [];
	}
	const requested = $derived(input());
	let entries = $state.raw(
		untrack(() => reconcilePresence([], requested, mode, initial ? undefined : false))
	);
	const exiting = new SvelteSet<symbol>();
	let alive = true;
	let parentRegistration: PresenceRegistration | undefined;

	function releaseParent() {
		if (propagate && parent && !parent.snapshot.isPresent && entries.length === 0)
			parentRegistration?.complete(parent.snapshot.generation);
	}
	function reconcile(next: PresenceInput<T>[]) {
		entries = reconcilePresence(entries, next, mode);
		const tokens = new Set(entries.filter((entry) => !entry.isPresent).map((entry) => entry.token));
		for (const token of [...exiting]) if (!tokens.has(token)) exiting.delete(token);
		for (const token of tokens) exiting.add(token);
		releaseParent();
	}
	function registerParent() {
		if (!propagate || !parent) return;
		const registration = untrack(() => parent.register());
		parentRegistration = registration;
		untrack(releaseParent);
		return () => {
			if (parentRegistration === registration) parentRegistration = undefined;
			registration.unregister();
		};
	}
	$effect.pre(registerParent);
	// Retained records depend on completed animations as well as current input.
	// They cannot be a pure derivation of the requested children.
	function updateRecords() {
		const next = requested;
		void mode;
		untrack(() => reconcile(next));
	}
	$effect.pre(updateRecords);
	function complete(token: symbol) {
		if (!alive || !entries.some((entry) => entry.token === token && !entry.isPresent)) return;
		entries = entries.filter((entry) => entry.token !== token);
		exiting.delete(token);
		if (exiting.size === 0) {
			onExitComplete?.();
			if (!alive) return;
			reconcile(input());
		}
		releaseParent();
	}
	const popOptions = $derived({
		anchorX,
		anchorY,
		root,
		nonce: nonce ?? (configuration() as { nonce?: string }).nonce
	});
	onDestroy(() => {
		alive = false;
		exiting.clear();
	});
</script>

{#each entries as entry (entry.token)}
	<AnimatePresenceItem
		{entry}
		{custom}
		{presenceAffectsLayout}
		pop={mode === 'popLayout'}
		{popOptions}
		onComplete={complete}
		{children}
	/>
{/each}
