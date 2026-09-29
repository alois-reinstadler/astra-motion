<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { MotionProps, MotionTag } from './MotionComponent.svelte';
	import type { ComponentMotionProps } from './component-props.js';
	import type { ReorderAxis } from './reorder-context.js';
	export type ReorderGroupProps<T, Tag extends MotionTag = 'ul'> = Omit<
		MotionProps<Tag>,
		keyof ComponentMotionProps | 'as' | 'children' | 'ref'
	> &
		Omit<ComponentMotionProps, 'values'> & {
			as?: Tag;
			axis?: ReorderAxis;
			/** Ordered item identities. Bind with `bind:values={items}` for automatic updates. */
			values: T[];
			/** Receives a proposed order. When supplied, owns acceptance even with `bind:values`:
			 * assign the proposal to your values to accept it, or leave them unchanged to reject.
			 */
			onReorder?: (values: T[]) => void;
			children?: Snippet;
			ref?: HTMLElement | null;
		};
</script>

<script lang="ts" generics="T, Tag extends MotionTag = 'ul'">
	import { onDestroy, tick, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import Motion from './MotionComponent.svelte';
	import {
		createReorderScroll,
		detectReorderAxis,
		provideReorder,
		reorderValues,
		type ReorderBox
	} from './reorder-context.js';
	let {
		as = 'ul' as Tag,
		axis,
		values = $bindable(),
		onReorder,
		children,
		ref = $bindable(),
		style,
		...props
	}: ReorderGroupProps<T, Tag> = $props();
	if (!Array.isArray(untrack(() => values)))
		throw new Error('Astra Reorder.Group requires a values array.');
	const layouts = new SvelteMap<T, ReorderBox>();
	let blockedOrder: T[] | undefined;
	let focusRevision = 0;
	const scrolling = createReorderScroll(() => ref);
	const detected = $derived(
		detectReorderAxis(
			values.flatMap((value) => {
				const layout = layouts.get(value);
				return layout ? [layout] : [];
			})
		)
	);
	provideReorder<T>({
		get axis() {
			return axis ?? detected;
		},
		register(value, layout) {
			layouts.set(value, layout);
		},
		unregister(value) {
			layouts.delete(value);
		},
		update(value, offset, velocity) {
			if (
				blockedOrder?.length === values.length &&
				blockedOrder.every((item, index) => item === values[index])
			)
				return;
			const order = values.flatMap((item) => {
				const layout = layouts.get(item);
				return layout ? [{ value: item, layout }] : [];
			});
			const next = reorderValues(
				order,
				value,
				offset,
				velocity,
				axis ?? detected,
				!!ref && ref.ownerDocument.defaultView?.getComputedStyle(ref).direction === 'rtl'
			);
			if (next === order) return;
			const reordered = values.slice();
			const positions = order.map((item) => values.indexOf(item.value));
			next.forEach((item, index) => {
				reordered[positions[index]] = item.value;
			});
			blockedOrder = values.slice();
			// An explicit callback retains controlled-mode authority, including
			// when values is bound. Never commit first and notify afterwards.
			if (onReorder) onReorder(reordered);
			else values = reordered;
		},
		scroll(event, velocity) {
			scrolling.update(event, velocity, axis ?? detected);
		},
		stopScroll() {
			// Deduplicate a rejected proposal during this gesture, but permit
			// a later gesture to ask again without an application reorder.
			blockedOrder = undefined;
			scrolling.stop();
		}
	});
	function pruneRemovedValues() {
		if (!Array.isArray(values)) throw new Error('Astra Reorder.Group requires a values array.');
		const current = new Set(values);
		if (current.size !== values.length)
			throw new Error('Astra Reorder.Group values must be unique.');
		for (const value of layouts.keys()) if (!current.has(value)) layouts.delete(value);
	}
	$effect(pruneRemovedValues);
	function preserveFocusedItem() {
		values.slice();
		untrack(() => {
			const revision = ++focusRevision;
			const group = ref;
			const document = group?.ownerDocument;
			const focused = document?.activeElement;
			if (!group || !document || !focused || !group.contains(focused)) return;
			let focusChanged = false;
			const trackFocus = (event: FocusEvent) => {
				if (event.target !== focused) focusChanged = true;
			};
			document.addEventListener('focusin', trackFocus);
			// Moving a keyed DOM fragment can blur its focused descendant. Restore
			// it after the move only if focus was not intentionally placed elsewhere.
			void tick().then(() => {
				document.removeEventListener('focusin', trackFocus);
				if (
					focusChanged ||
					revision !== focusRevision ||
					!group.isConnected ||
					!focused.isConnected ||
					!group.contains(focused) ||
					document.activeElement !== document.body ||
					!('focus' in focused)
				)
					return;
				(focused as HTMLElement).focus({ preventScroll: true });
			});
		});
	}
	$effect.pre(preserveFocusedItem);
	onDestroy(() => {
		focusRevision++;
		layouts.clear();
		scrolling.stop();
	});
	const groupStyle = $derived(
		typeof style === 'string'
			? `overflow-anchor:none;${style}`
			: { overflowAnchor: 'none', ...style }
	);
</script>

<!-- The public generic checks native tag props; Motion forwards them to its dynamic element. -->
<Motion as={as as 'div'} {...props as MotionProps<'div'>} bind:ref style={groupStyle}>
	{@render children?.()}
</Motion>
