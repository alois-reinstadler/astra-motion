# Shared implementation contracts

Reference date: 2026-09-27 UTC. Normative scope is the user's requested Motion
surface, superseding earlier exclusions. Current official Motion pages were read
alongside npm Motion/framer-motion/motion-dom 13.4.4 (git
636e725fc71315ca91ff196eb09685017e2fe0c8) and motion-utils 13.3.0. Current Svelte
baseline is 5.57.0, SvelteKit 2.70.3. Engine upgrade remains under qualification.

## Svelte authoring

- `motion.*` direct props remain primary; legacy `motion={{...}}` stays supported.
- Native bindings and create* helpers remain available and retain their ownership
  contracts. use* helpers are component-scoped, with automatic disposal, reactive
  getter inputs where re-evaluation is required, and no React hook call-order rules.
- MotionValue helpers return the shared engine MotionValue. Reactive booleans/data
  return an object with a `.current` getter, avoiding a stale primitive snapshot.
- `useAnimate` returns `[scope, animate]`; scope supports an attachment and `.current`.
  It accepts the general DOM engine subjects/sequence overloads. `createAnimate`
  remains the stricter existing scoped owner API.
- HTML and SVG use one compatible Motion DOM identity. No React runtime imports.

## Presence

Svelte snippets are opaque, so `AnimatePresence` owns explicit `present` or keyed
`items` plus `key` and `children(item)` instead of inspecting child arrays. It defaults
to sync; existing `Presence` retains its wait default. Modes include sync/wait/popLayout.
Nested boundaries shield exits unless propagate is true. Dynamic custom values,
manual removal and re-entry are generation-scoped.

Internal bridge (`presence-context.svelte.ts`):

```ts
type PresenceSnapshot = {
	isPresent: boolean;
	initial: false | undefined;
	custom: unknown;
	generation: number;
};
type PresenceRegistration = { complete(generation: number): void; unregister(): void };
type PresenceScope = {
	readonly snapshot: PresenceSnapshot;
	register(): PresenceRegistration;
	subscribe(listener: (snapshot: PresenceSnapshot) => void): () => void;
	registerNode(node: HTMLElement | SVGElement): () => void;
};
```

Subscribe invokes immediately. Acknowledgements from old generations are ignored.
Core registers after mounting, passes custom/initial/isPresent to the visual, drives
exit state, and suppresses a second native outro after managed exit completion.
Native conditional removal within a still-present boundary keeps native outros.
`usePresence` exposes `{isPresent, safeToRemove}` with a generation-captured callback;
`useIsPresent` and `usePresenceData<T>` expose `.current`.

## Activity: explicitly agreed adaptation

The user approved retained child/DOM state, coordinated exit/visibility, automatic
suspension of Astra-owned work while hidden, and an activity-aware application-effect
helper. Ordinary Svelte `$effect`s stay active unless using that helper. React
Activity's arbitrary subtree effect suspension and background scheduling have no
public Svelte equivalent. This is an explicit documented adaptation, not an assertion
that Svelte has React's Activity lifecycle. Motion's component reference is Motion+
alpha; versioned source availability must be recorded separately from stable Motion.

## Gestures/layout

Gesture adapters support HTMLElement and SVGElement, page-space pointer info,
reactive transformPagePoint, getter/ref constraints and independent controls.
Configuration/root owns transformPagePoint and nonce; gesture worker owns coordinate
correction helpers and controls. Root owns core rebind dependencies and prop filtering.
Layout direct props map to the existing projection coordinator, preserving transformed
external ancestor and nested sticky/scroll regression coverage.

## Discrepancies requiring explicit evidence

- dragElastic documentation says 0.5; 13.4.4 source defaults to 0.35. Use measured
  source behavior for the baseline and state the discrepancy in API/reference notes.
- Direction locking uses a separate >10px threshold in source, with y winning ties;
  configurable drag-start distance does not replace this threshold.
- Spring default stiffness/bounce prose differs from engine defaults (100/0.3).
- useReducedMotion docs promise live updates missing from React's hook: Astra follows
  the documented live behavior. useAnimationFrame(undefined) should pause as the
  usePageInView guide recommends, even though the current upstream hook calls it.
- useInView initial:true should settle on the first observation, including outside;
  Astra preserves its existing fix rather than copying upstream's missed observation.
- A springValue unit-string skipInitialAnimation path doubles units upstream; managed
  useSpring must avoid the defect without silently modifying raw engine exports.

All claims require tests and matrix evidence before completion. Three-browser
qualification and packed consumer runtime lifecycle coverage are delivery gates.
