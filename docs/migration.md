# Motion parity migration

Reference: 27 September 2026; Motion, Framer Motion and Motion DOM 13.4.4,
Motion Utils13.3.0; Svelte5.57.0. The requested surface supersedes earlier scope
exclusions. Current contracts and evidence live in [the parity matrix](parity/MATRIX.md).

## Keep existing integrations working

`createMotion`, `createLayout`, `createAnimate`, `createScroll`, `createInView`,
`Presence`, `presence`, `popLayout` and the route adapter remain supported. Existing
`motion={{ ... }}` component props remain valid; a defined direct prop wins over its
matching nested option. No compiler plugin is required.

Prefer direct `motion.*` props for new components. A generated element supplies native
SSR styles and a Svelte outro. A native binding still needs its spread and
`transition:binding.transition|global` for native exit retention. Native directives
such as `bind:group` and parent-scoped CSS selectors belong to native markup.

## Primary component behavior

Primary motion components use the qualified Motion engine’s property defaults,
keyframes, repeats and animation lifecycle. Low-level native bindings retain their
finite Svelte-transition path and historical defaults. Set explicit transition values
where application timing must remain identical after a migration.

The primary component reduced-motion default is `never`, following Motion’s baseline.
Existing low-level bindings retain `user`. Set `MotionConfig reducedMotion="user"`
near the application root to make the application choice explicit. Primary reduction
settles positional/layout animation while paint effects can continue.

The primary API follows upstream raw-transform precedence. A nonempty `transform`
takes precedence over independent transform aliases. Removing a target can return to
its initial or authored base; use an explicit empty raw transform before aliases take
over. Native bindings retain their stricter transform ownership diagnostic.

## Presence and Activity

`Presence` defaults to `wait`. `AnimatePresence` defaults to `sync` and accepts
`present`, or `items` plus `key` and `children(item)`. It coordinates descendants,
manual removal, nested propagation and `popLayout`. Use item identity, not array
indices, when ordering can change. Keep a manual `safeToRemove` callback captured for
the exit generation that started the work.

`AnimateActivity` stays mounted while `mode` changes. Child state and DOM survive;
Astra-owned work pauses only after exits complete and the phase becomes hidden.
Ordinary Svelte effects remain active. Replace an effect that should stop while hidden
with `useActivityEffect(() => { ...; return cleanup; })`. This approved adaptation does
not claim to suspend third-party effects or change Svelte scheduler priorities.

## Helpers and values

Managed helpers initialize during Svelte component setup, with reactive getter inputs
for changing sources/options. Read `.current` from visibility/preference helpers in
markup or effects; destructuring it once loses reactivity. MotionValues retain `.get`,
`.set`, `.jump`, subscriptions, velocity and engine identity.

`useAnimate` returns `[scope, animate]`; attach the root with `{@attach scope.attach}`.
Read `scope.current` to access that element; it is a read-only getter, not a binding target.
Selectors are scoped; explicitly supplied subjects use the general engine contract.
`createAnimate` retains its stricter owned-element scope, collision diagnostics and
`settled` cancellation result. Do not rename one helper without adapting the contract.

For direct live text, write `<motion.span children={formatted} />` with a MotionValue.
`<motion.span>{formatted}</motion.span>` is an ordinary Svelte snippet and does not
subscribe automatically.

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
