# Motion parity migration

Reference: 27 September 2026; Motion, Framer Motion and Motion DOM 13.4.4,
Motion Utils 13.3.0; Svelte 5.57.0. The requested surface supersedes earlier scope
exclusions. Current contracts and evidence live in [the parity matrix](parity/MATRIX.md).

## Keep existing integrations working

`createMotion`, `createLayout`, `createAnimate`, `createScroll`, `createInView`,
`Presence`, `presence`, `popLayout` and the route adapter remain supported. Existing
`motion={{ ... }}` component props remain valid; a defined direct prop wins over its
matching nested option. No compiler plugin is required.

Prefer direct `motion.*` props for new elements, `motion.bind` for existing native
markup, and `motion.create` for reusable components with attachment forwarding. A generated element supplies native
SSR styles and a Svelte outro. A native binding still needs its spread and
`transition:binding.transition|global` for native exit retention. Native directives
such as `bind:group` and parent-scoped CSS selectors belong to native markup.

## Primary component behavior

Primary motion components use the qualified Motion engine’s property defaults,
keyframes, repeats and animation lifecycle. Modern `motion.bind` uses the same
contract. `createMotion` compatibility bindings retain their finite Svelte-transition
path and historical defaults. Set explicit transition values
where application timing must remain identical after a migration.

The primary component reduced-motion default is `never`, following Motion’s baseline.
`motion.bind` shares that default; existing `createMotion` bindings retain `user`. Set `MotionConfig reducedMotion="user"`
near the application root to make the application choice explicit. Primary reduction
settles positional/layout animation while paint effects can continue.

The primary API follows upstream raw-transform precedence. A nonempty `transform`
takes precedence over independent transform aliases. Removing a target can return to
its initial or authored base; use an explicit empty raw transform before aliases take
over. `motion.bind` follows that precedence. `createMotion` compatibility bindings retain
their stricter transform ownership diagnostic.

## Presence and Activity

`Presence` defaults to `wait`. `AnimatePresence` defaults to `sync` and accepts
`present`, `items` plus `key`, or `value` with an optional identity selector. The
`children(item)` snippet receives retained outgoing data. Null/undefined values are
absent; objects use reference identity without a selector. The forms are mutually exclusive. It coordinates descendants,
manual removal, nested propagation and `popLayout`. Use item identity, not array
indices, when ordering can change. Keep a manual `safeToRemove` callback captured for
the exit generation that started the work.

`AnimateActivity` stays mounted while `mode` changes. Child state and DOM survive;
Astra-owned work pauses only after exits complete and the phase becomes hidden.
Ordinary Svelte effects remain active. Replace an effect that should stop while hidden
with `useActivityEffect(() => { ...; return cleanup; })`. This Svelte adaptation does
not claim to suspend third-party effects or change Svelte scheduler priorities.
Borrowed MotionValues retain their external playback owner; reading one inside a
hidden panel does not pause playback used elsewhere. See the
[Activity reference](https://alois-reinstadler.github.io/astra-motion/docs/animate-activity)
for visibility phases and ownership details.

## Helpers and values

Managed helpers initialize during Svelte component setup, with reactive getter inputs
for changing sources/options. Read `.current` from visibility/preference helpers in
markup or effects; destructuring it once loses reactivity. MotionValues retain `.get`,
`.set`, `.jump`, subscriptions, velocity and engine identity.

`useAnimate` returns `[scope, animate]`; attach the root with `{@attach scope.attach}`.
Read `scope.current` to access that element; it is a read-only getter, not a binding target.
Selectors are scoped; explicitly supplied subjects use the general engine contract.
`createAnimate` retains its stricter owned-element scope, collision diagnostics and
`settled` cancellation result. `useAnimate` now also exposes the same additive
settlement result: finished, or cancelled with stopped/cancelled/replaced/detached.
Upstream `finished` remains completion-only. Pause leaves settlement pending; replay
after completion creates a fresh cycle. Scope cleanup affects owned playback, never
an externally owned animation merely because a consumer disappears. Do not rename
one helper without adapting its ownership contract.

For direct live text, write `<motion.span children={formatted} />` with a MotionValue.
`<motion.span>{formatted}</motion.span>` is an ordinary Svelte snippet and does not
subscribe automatically. Use `motionStore(value)` for ordinary Svelte text,
conditions and controls, then read `$store`. Reactive state helpers use `.current`;
MotionValues use `.get()`/`.set()` and direct animated styles. `useMotionValue(initial)`
is intentionally an initial-value-only input; function callbacks stay callbacks.

## SVG, custom components and lazy loading

Generated components include HTML and SVG. `bind:ref` yields the native root.
`motion.create` wraps custom Svelte components that forward their received attachment
props to one native element. Create the wrapper once outside a reactive render path;
changing the wrapped component or native root tag recreates identity.

For lazy loading, import `m` from `astra-motion/m` and `LazyMotion` from
`astra-motion/lazy`. A loader resolves the named feature bundle. `domAnimation`
provides targets and basic gestures; `domMax` adds pan, drag and projection. Keep eager
imports out of the initial route when deferral matters. Native content and its DOM
identity survive loading.

## View transitions

The existing route coordinator remains available. New `AnimateView` boundaries pair
with explicit `startViewTransition` state transactions; SvelteKit navigation uses
`astra-motion/view-navigation`. Install only one native document coordinator. Both
fallback and cancellation apply the intended state update; completion/error behavior
is described in the reference rather than inferred from a visual callback.

## Links and historical records

Old documentation routes remain static aliases of each concept’s new primary page. Useful old
section IDs remain aliases. Historical research and reviews retain their dates;
their previous feature exclusions are not the current scope. The existing visual
design and larger examples are preserved.

## Coming from Motion for React

Use `$state`, snippets and lowercase DOM events with familiar motion targets and
variants. Initialize `use*` helpers in component setup; Svelte runs setup once, so
React’s render call-order model and dependency arrays do not apply. Changing helper
inputs use static values or reactive getters. Presence identity is explicit because
Svelte snippets are opaque. Keep component identity stable when calling `motion.create`.

## Binding and controlled reorder

`Reorder.Group bind:values={items}` automatically assigns a new ordered array while
preserving item references. Existing `values` plus `onReorder` stays controlled.
If both binding and callback are supplied, the callback still owns acceptance:
assign the proposal to accept it or leave values unchanged to reject. Application
updates do not notify, and rejected proposals deduplicate during a gesture.

## Additional helpers and intentional limits

`useFollowValue` follows scalar, unit-string or borrowed MotionValue targets with a
spring by default; supply tween/inertia options when needed. `useWillChange` explicitly
opts a style into the pinned engine’s persistent will-change hint. Neither adds a
blanket automatic hint to existing elements. `animateView` offers a fluent alternative
for imperative snapshot targets through the existing document coordinator. Use
`AnimateView` plus `startViewTransition` for already registered boundary nodes.

`MotionConfig.isStatic` is an internal upstream implementation flag, not a supported
Astra prop. Use `initial={false}` for an immediate initial pose, `reducedMotion="always"`
for motion policy, or omit animation for a static component; these are distinct
contracts rather than a claim to emulate that internal flag. The vgpu/Threlte proof
of concept remains experimental and outside the core package dependency graph.
