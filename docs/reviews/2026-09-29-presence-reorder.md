# Presence and reorder release-candidate changes

Baseline: isolated `agent/astra-rc-presence` worktree from `c2f1795`.

## Contracts

`Reorder.Group` accepts `bind:values={items}`. Without `onReorder`, accepted pointer proposals assign a fresh ordered array through the binding; item references and keyed DOM are retained. Application updates do not emit reorder callbacks.

An explicit `onReorder` remains the sole proposal authority, including when `bind:values` is also supplied. Assign `items = next` in the callback to accept a proposal; leave items unchanged to reject. The group never writes the binding before or after invoking that callback. A rejected proposal is deduplicated during the gesture; a later gesture may propose again.

```svelte
<Reorder.Group bind:values={items}>
	{#each items as item (item.id)}
		<Reorder.Item value={item}>{item.label}</Reorder.Item>
	{/each}
</Reorder.Group>
```

For validation, use `values={items} onReorder={(next) => { if (allowed(next)) items = next; }}`. Supplying that callback together with a binding has the same validation semantics; the callback is not merely a notification.

`AnimatePresence` adds `value` to the existing `present` and `items` forms. These three forms are mutually exclusive in declarations and at runtime, including explicitly supplied undefined props. An omitted form still defaults to `present=true`. In the single-value form, null and undefined are absent; false, zero and the empty string are displayed values.

```svelte
<AnimatePresence value={selected} key={(item) => item.id} mode="wait">
	{#snippet children(item)}
		<motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
			{item.title}
		</motion.section>
	{/snippet}
</AnimatePresence>
```

The optional key selector defaults to the value itself, using Map/SameValueZero identity. Objects use reference identity. Replacing an object with another object creates a new record unless a selector returns the same identity. The child snippet receives the retained outgoing item, not the current outer selection. Existing `sync`, `wait`, `popLayout`, initial, custom and propagation semantics are reused. Exits retain item references, not deep snapshots of externally mutated objects.

`PresenceKey` now also permits boolean, bigint and object identities. Existing string/number/symbol keys remain unchanged. No new reconciliation algorithm or Switch/Swap component was introduced.

## Verification record

See parent integration record for final candidate qualification. This bounded workstream runs focused server/browser tests, declarations, formatting, ESLint and the Svelte MCP autofixer. No full-suite, independent-package, physical-device or headed-browser claim is made here.

Evidence logs: `/tmp/astra-presence-server.log`, `/tmp/astra-presence-browser.log`, `/tmp/astra-presence-types.log`, `/tmp/astra-presence-eslint.log`.

Focused executed results:

- Server: 22 tests across new single-value SSR/type/model contracts, existing presence-model contracts, and existing reorder SSR/types.
- Chromium: 23 tests across new presence/reorder fixtures and existing managed-presence/reorder suites. Includes sync/wait/popLayout, outgoing data, rapid replacement, reversal/re-entry, object identity, pointer list/grid binding, controlled rejection/retry, and application replacement.
- Svelte check: zero errors and warnings; scoped ESLint, Prettier and diff whitespace checks pass.
- Svelte MCP autofixer: all four changed/new Svelte components return no issues or suggestions.

Test-development corrections: exit progress must inspect computed opacity because WAAPI need not update inline styles every frame; SSR errors are observed by reading the lazy render result body; retry gestures wait for the actual return-to-origin value rather than sleeping. Application removals retain Svelte outro DOM briefly, so the removal assertion polls for actual completion.
