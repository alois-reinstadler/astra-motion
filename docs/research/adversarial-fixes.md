# Adversarial review fixes

Implemented on 2026-09-05 after the independent project review.

## Runtime changes

- Reactive animate targets interrupt native intros from their current sampled pose.
  Equivalent targets keep the intro running. Cancelled trajectories cannot apply stale
  ticks or transitionEnd values. Exit/reentry during the replacement animation is covered.
- Automatic layout observes each participant's parent subtree, direct ancestor mutations,
  and ancestor resizes. Batches select affected projection trees and shared-ID partners.
  Unrelated text changes cause zero measurements in the 20-participant regression.
- Motion-owned style writes are filtered before affected-set expansion. The instrumented
  100-participant transform probe fell from 10,200 to 100 participant insertions with no
  invalidation. Dirty sibling records share scope expansion within a batch.
- MotionConfig subscriptions follow provider ancestry. Unrelated trees receive no config
  updates; retained descendants still receive reduced-motion changes through paused providers.
- State bindings reject authored CSS scale, translate, and rotate, matching layout ownership.
- Unrelated or redundant native intro/outro events no longer schedule a layout commit.

## Authoring and migration

`Motion` is exported from `astra-motion`. It creates a binding per component instance,
renders the HTML element selected by `as`, merges CSS and SSR initial styles, forwards
native attributes/events, and installs its native transition. Keyed list items therefore
retain their exits without an additional directive. Use `motion={{ initial, animate, exit }}`
for animation options and `bind:ref` for the native element.

Keep `as` stable while mounted; use `{#key tag}` when changing the native tag. Native
value bindings still require a native element or event/ref integration. Native attribute
and event-target types are checked. The internal forwarding cast contains one narrowly
documented TS2590 suppression for TypeScript's generic union expansion limit.

Position-only reflow from outside a participant's default parent subtree requires an
explicit wider `createLayout({ observationRoot: () => root })`, or `layout.update`.
The extended sidebar/cards demo now declares that wider root. Explicit transactions
remain global, and direct html/body changes can still invalidate descendants.

Matching layout IDs require the same layoutGroup or explicitly named controller scope.
The new component does not change this isolation contract. README, the authoring guide,
and the Getting started page document the supported paths.

## Repository checks

CI now runs type checking, lint, guide consumer checks, Node/SSR tests, and separate
Chromium, Firefox, and WebKit jobs. The pnpm version is recorded in package.json, and
Svelte/SvelteKit development dependency floors match the supported peer floors without
upgrading the resolved versions. Existing generated UI formatting was normalized to the
repository's Prettier configuration. The tooltip unused parameter was removed; the generic
button documents that callers resolve application routes before passing href.

## Validation

- `pnpm run check`: zero errors and warnings.
- `pnpm run check:guide`: zero errors and warnings, including the new component recipe.
- `pnpm run lint`: passes.
- `pnpm run test:server`: 84 tests pass, including SSR.
- Combined browser run: 753 cases; 751 passed and two WebKit soak cases failed under the
  former timeout budget. The first timeout left an unfinished loop interfering with the
  following test. The scroll soak timeout was increased to 60 seconds; all cycle counts,
  ownership/listener assertions, and progress checks were retained. The entire soak file
  then passed all 15 cases across the three engines. All 753 distinct cases are covered
  by the combined run and that targeted rerun.
- Native attribute typing: valid anchor/button/input usages pass; five deliberately invalid
  attribute/event cases are rejected by an isolated Svelte consumer check.
- Browser inspection: the live 20-reversal flow settles to one visible card; sidebar/density
  and updated documentation were inspected. Screenshots were reviewed; final browser page
  errors and console errors were empty.

The extended-layout test helper now completes paused controls explicitly. Previously it
only sought past their duration and relied on incidental global invalidation to clear them.
Its geometry and active-animation assertions are unchanged.

No application build, packed-package qualification, remote CI run, or publication was
performed. Full Motion React feature parity, SVG state bindings, advanced drag controls,
and expanded presence lifecycle APIs remain outside this change.
