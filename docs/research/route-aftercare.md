# Route transition aftercare

The route backend remains SvelteKit's `onNavigate` plus native same-document View
Transitions. Motion projection is deliberately absent from this entry point.

## Changes

- `routeTransitions()` inherits the nearest `MotionConfig` reduced-motion policy.
  Its explicit `reducedMotion` option takes precedence. A live operating-system or
  inherited configuration change to reduced motion skips an active transition,
  releases any pending navigation handshake and restores temporary names.
- Route identities are filtered by their owner document. An iframe's registered
  node cannot collide with a same-ID node in the coordinator's document.
- Temporary `view-transition-name` values use inline `!important`, so an authored
  important stylesheet declaration cannot override scoped identity assignment.
  Cleanup restores the original inline value and priority. Application changes
  made during the transition remain intact.
- Diagnostic callbacks are advisory. A logger throwing an exception cannot stall
  navigation or create an unhandled rejected transition promise.
- Navigation completion is observed immediately, before the browser's deferred
  update callback. This closes an unhandled-rejection window when a pending
  navigation is superseded before old-view capture finishes.

## Policy authoring

```svelte
<!-- persistent child layout, underneath the application's MotionConfig -->
<script lang="ts">
	import { routeTransitions } from 'astra-motion/routes';
	let { children } = $props();
	routeTransitions();
</script>

{@render children()}
```

A provider must be an ancestor component of the component calling
`routeTransitions`; rendering a provider later in that same component does not
change the component's inherited context. Without a provider, the default remains
`prefers-reduced-motion`. Explicit overrides remain available:

```ts
routeTransitions({ reducedMotion: 'never' });
```

Call the coordinator once in a persistent layout. It owns neither router history
nor scroll/focus restoration. Standard links, `goto`, and browser back/forward
continue through Kit. An unsupported browser navigates immediately.

## Verification

- 16 route coordinator unit cases cover retention/name restoration, scoped and
  duplicate IDs, supersession, browser rejection, early navigation rejection,
  SSR, unsupported browsers, document isolation, disposal, diagnostic failures,
  live policy updates and explicit overrides.
- Two additional real-browser regressions exercise a 20-second native transition
  interrupted by an OS reduced-motion change, and an authored important CSS name
  collision that must not cause snapshot rejection. Both pass Chromium, Firefox
  and WebKit.
- Existing route cases cover SSR/hydration, link and programmatic navigation,
  accepted old/new shared snapshots, genuine asynchronous-load supersession,
  browser history, scroll restoration and focus reset.
- The initial 27-case focused route run passed 26 cases; an existing WebKit
  SSR/history case reported a module import failure during concurrent dev edits.
  Its complete six-case WebKit route file rerun passed. This is recorded as a
  development-run interruption, not hidden as a passing first run.
- Chrome agent-browser verification inspected the product-detail screenshot,
  confirmed zero remaining temporary names and native animations, and found no
  page errors or console errors.

No application build or deployment was performed. These tests do not qualify
actual BFCache restoration, every browser's rendering of differing aspect ratios,
streamed late content, or native cross-document View Transitions. `pagehide`
cleanup exists, but is not evidence of a full BFCache test.

## Public platform contracts

SvelteKit waits for an `onNavigate` callback's returned promise before completing
navigation, and explicitly documents native View Transitions as a use case.
[Official SvelteKit navigation documentation](https://svelte.dev/docs/kit/$app-navigation#onNavigate).

`skipTransition()` skips the animation while retaining the update callback. The
adapter therefore releases navigation and uses a cancellation guard so a late
callback cannot assign stale names.
[MDN ViewTransition.skipTransition](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition/skipTransition).

Svelte context is inherited through the component tree; it is the existing policy
channel rather than a new global configuration store.
[Official Svelte context documentation](https://svelte.dev/docs/svelte/context).

## Native outros during route capture (September 2026 review)

A real-browser adversarial fixture exposed a missed shared-element pair: Svelte
retained an outgoing source for its native fade while its same-ID destination
mounted, so the coordinator diagnosed a duplicate and left the destination
unnamed. Direct and ancestor-owned outros both reproduced this failure.

The coordinator now observes native transition lifecycle events in capture phase
and records each old shared source's inert ancestors. During new-view capture,
only an old source that acquired an inert ancestor and has a fresh non-inert
same-ID replacement is excluded. Existing inert ancestors are preserved in that
comparison; existing persistent identities and genuinely duplicate live
identities keep their previous behavior. Finished children retained by an outer
outro group remain excluded. Restored inert state clears exit metadata on
out-only reversal, which does not emit `introstart`. Session snapshots and
listeners are released on completion/disposal; no projection runtime is imported.

This bounded fallback depends on Svelte 5.57.0's synchronous inert behavior.
`outrostart` occurs later, after the dummy WAAPI animation's finish callback, even
with zero delay. Awaiting a frame inside the native View Transition update
callback is invalid here: Chromium suppressed the frame and aborted both repros
with a DOM-update timeout after approximately four seconds. The adapter waits
for neither frames nor transition events during route commit. See the installed
version's [Svelte transition implementation](https://github.com/sveltejs/svelte/blob/svelte%405.57.0/packages/svelte/src/internal/client/dom/elements/transitions.js).

There is one explicit ambiguity: application code that independently makes an
old shared node (or a new ancestor) inert during the same navigation that inserts
its non-inert same-ID replacement is indistinguishable from this native Svelte
outro convention. It is treated as outgoing. An already authored inert source is
not silently excluded; if it coexists with a same-ID destination without a new
inert ancestor, the pair is diagnosed/skipped. Recheck this convention when
upgrading Svelte.

Five regressions use real Svelte transitions and real native View Transitions
(the Kit navigation handshake is mocked): repeated direct/ancestor reversal,
persistent shared identities, live duplicate destinations, preauthored inert
sources, and disposal/name/listener cleanup. All five pass Chromium, Firefox,
and WebKit. The existing 16 coordinator unit cases also pass.

The follow-up real-Kit route/navigation run passed 26/27 cases. Chromium's
existing live-reduced-motion case observed no temporary names before its policy
change; its focused three-run repeat then passed 3/3. No reproducible cause was
established, so this initial failure is retained in the record rather than
counted as a clean 27-case first pass. Manual Chrome product navigation showed a
clean detail screenshot, zero page/console errors, zero temporary names, and
zero remaining native animations (`/tmp/astra-soak-route-review.png`).
