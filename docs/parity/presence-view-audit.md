# Presence, activity, and view-transition parity audit

Reference audit: **2026-09-27 UTC**; implementation/evidence update: **2026-09-28 UTC**. Astra starting revision: `b66e376`.

The components, contexts, coordinator, examples and named tests below are now implemented and integrated into the parity worktree. This matrix distinguishes verified cases from implemented options whose additional composition gates remain open. Final packed-consumer qualification, independent review, release-wide browser checks and deployed-site verification belong to the root delivery record; this subsystem audit does not claim those gates have passed.

## Baselines and primary references

| Baseline                         | Exact version / source revision                                                                                                                     | Qualification                                                                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astra's starting Motion baseline | `motion@13.4.3`, `framer-motion@13.4.3`, `motion-dom@13.4.2`, `motion-utils@13.3.0`                                                                 | Historical starting point. The parity integration now pins Motion/framer-motion/motion-dom 13.4.4 and motion-utils 13.3.0 with one runtime engine identity.                                                                                                    |
| Current public Motion release    | `motion@13.4.4`, `framer-motion@13.4.4`, `motion-dom@13.4.4`, `motion-utils@13.3.0`; Motion git revision `636e725fc71315ca91ff196eb09685017e2fe0c8` | Registry tarballs and their ESM implementation/source maps inspected. Presence implementation differs from 13.4.3 only by a comment correction; AnimateView implementation is identical.                                                                       |
| React stable                     | `react@19.3.0`; revision `1d34f91dfde6bba84d08b683aaba164c7194dacb`                                                                                 | Both `Activity` and `ViewTransition` are stable exports in this release. AnimateView specifically needs React **and React DOM** >=19.3.                                                                                                                        |
| React canary                     | `19.3.0-canary-d083ec1d-20260922`; revision `d083ec1da1e5252abd3ddfdde6dfbc09701a2c51`                                                              | Recorded separately. Astra's contract must not depend on this canary.                                                                                                                                                                                          |
| AnimateActivity                  | Motion+ Early Access/alpha, public page specifies `motion >=12.23.24`, `react >=19.2.0`                                                             | No public stable Motion export or publicly inspectable implementation was found. A Motion+ package version cannot honestly be supplied without authorized package access. The public alpha documentation and React stable Activity semantics are the baseline. |

Reference IDs used in the matrix:

- **P-D**: [AnimatePresence reference](https://motion.dev/docs/react-animate-presence).
- **P-S**: [AnimatePresence source](https://github.com/motiondivision/motion/tree/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/AnimatePresence), including `index.tsx`, `PresenceChild.tsx`, `PopChild.tsx`, `use-presence.ts`, and `use-presence-data.ts`.
- **P-X**: [Motion exit feature](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/motion/features/animation/exit.ts).
- **A-D**: [AnimateActivity alpha reference](https://motion.dev/docs/react-animate-activity).
- **A-R**: [React Activity reference](https://react.dev/reference/react/Activity).
- **A-S**: [React commit lifecycle](https://github.com/facebook/react/blob/1d34f91dfde6bba84d08b683aaba164c7194dacb/packages/react-reconciler/src/ReactFiberCommitWork.js), notably `hideOrUnhideAllChildren`, `disappearLayoutEffects`, `reappearLayoutEffects`, `disconnectPassiveEffect`, and `reconnectPassiveEffects`.
- **V-D**: [AnimateView reference](https://motion.dev/docs/react-animate-view).
- **V-S**: [AnimateView source](https://github.com/motiondivision/motion/tree/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/AnimateView), notably `index.tsx`, `animate-view-layers.ts`, `shared-props.ts`, and `hooks/use-reset-view-transitions.ts`.
- **V-R**: [React ViewTransition reference](https://react.dev/reference/react/ViewTransition).
- **V-C**: [React transition coordination](https://github.com/facebook/react/blob/1d34f91dfde6bba84d08b683aaba164c7194dacb/packages/react-reconciler/src/ReactFiberCommitViewTransitions.js) and [DOM implementation](https://github.com/facebook/react/blob/1d34f91dfde6bba84d08b683aaba164c7194dacb/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js).
- **S-S**: [Svelte snippets](https://svelte.dev/docs/svelte/snippet), [effects](https://svelte.dev/docs/svelte/$effect), [context](https://svelte.dev/docs/svelte/context), [lifecycle](https://svelte.dev/docs/svelte/lifecycle-hooks), and [SvelteKit navigation](https://svelte.dev/docs/kit/$app-navigation).

The downloaded source copies are audit scratch files under
`/tmp/astra-presence-upstream`; durable references use exact upstream commits.
The root audit also retains the current Motion article text and a fetch manifest
under `/tmp/astra-motion-reference`.

## Agreed Svelte adaptations and shared boundaries

1. **Explicit presence data boundaries.** React receives enumerable keyed child
   elements. A Svelte snippet is executable markup, not a comparable child list.
   Svelte already retains nodes during native transitions, and Astra's existing
   `Presence` uses that facility, but native retention does not provide dynamic
   exit data or arbitrary asynchronous removal. Astra supplies `AnimatePresence` with
   `present` for conditional content and `items` plus `key` for keyed lists and
   replacements; render the retained item through `children(item)`. It defaults
   to `mode="sync"`. Preserve `Presence value` and its `mode="wait"` default.
   Root approved this architecture on the reference date.
2. **State retention and effect lifecycle.** React Activity retains DOM/component
   state while React disconnects and reconnects subtree effects. Svelte has no
   supported public API for arbitrary subtree effect suspension without removing
   its state. The user explicitly approved retaining children/DOM, coordinating
   exits before hiding, pausing Astra-owned work while hidden, and providing
   `useActivity` / `useActivityEffect` for application-owned activity-aware work.
   Ordinary Svelte `$effect` remains active. This is an agreed adaptation, not
   transparent React lifecycle equivalence. Hidden content is not scheduled at
   React's background priority, and React selective hydration is not promised.
3. **View-transition coordination.** Svelte has no React `startTransition`
   renderer boundary. Add an explicit application-state transaction helper that
   captures before the mutation and awaits Svelte DOM completion afterward;
   retain a SvelteKit-specific adapter using `onNavigate`. Async data preparation
   belongs in the transaction contract. Implemented as `startViewTransition(update, options)` plus wrapperless
   `AnimateView` attachments. The root approved this explicit coordinator
   adaptation; all queued mutation callbacks run, while `policy="replace"`
   cooperatively signals supersession without rolling application state back.
4. **DOM ownership.** Snippets do not automatically forward a DOM ref. A
   wrapperless presence record can register its motion elements and provide an
   explicit root attachment for plain/custom roots used by `popLayout`.
   Activity uses a stable configurable HTML host (`as`, default `div`), with
   `display: contents` while visible and `display: none` after exits. Its tag
   cannot change while preserving children. Table hosts are explicitly typed;
   arbitrary SVG hosts are not advertised. `AnimateView` renders only its
   `children(attachment)` snippet, and every participating root applies that
   attachment; multiple roots share one boundary callback.

### Implemented presence handoff

The new `presence-context.svelte.ts` supplies this internal structural contract:

```ts
interface PresenceSnapshot {
	readonly isPresent: boolean;
	readonly initial: false | undefined;
	readonly custom: unknown;
	readonly generation: number;
}

interface PresenceRegistration {
	complete(generation: number): void;
	unregister(): void;
}

interface PresenceScope {
	readonly snapshot: PresenceSnapshot;
	register(): PresenceRegistration;
	subscribe(listener: (snapshot: PresenceSnapshot) => void): () => void;
	registerNode(node: HTMLElement | SVGElement): () => void;
}

declare function readPresenceScope(): PresenceScope | undefined;
```

`subscribe` immediately sends the current immutable snapshot. Presence changes
increment the generation. Custom-only changes notify without restarting the exit
generation. A completion is accepted only for the active absent generation;
unregistering releases a participant, including during exit. A boundary registers
all participants before allowing an empty exit to complete in a microtask.

Core bindings read the scope during component initialization, register their
visual/node when mounted, and project its state into Motion's presence context.
They drive `animationState.setActive('exit', true)` and acknowledge the captured
generation after all applicable animation work. Re-entry clears exit priority,
cancels stale completion, and keeps the same element. Final managed removal must
not start a second native outro. Local conditionals inside a live retained record
continue to use native Svelte transitions. Keep the native timeline path for
existing `Presence`, direct conditional elements, and explicit transition users.

`usePresence()` returns reactive getters `{ isPresent, safeToRemove }`.
`safeToRemove` must return a callback captured for the current exit generation,
so an old timeout cannot release a new exit. `useIsPresent()` and
`usePresenceData<T>()` expose a readonly reactive `current` getter; returning a
copied boolean/value would make Svelte callers stale. Outside a boundary, presence
is true, data is undefined, and manual removal is a harmless no-op.

Activity exports `readActivityState(): () => boolean` for owned-work integration.
The value remains true during coordinated exits and becomes false after final
hiding. Nested hidden activity makes descendants inactive even if their own mode
is visible. Automatic work must resume from the retained current value, not
recreate application state. Owner teardown must dispose every subscription.

## Evidence keys and status meanings

All source contracts below use the exact baselines above. Documentation keys refer to the canonical records in `src/lib/site/content/presence-view.ts`: **DP** `/docs/animate-presence`, **DA** `/docs/animate-activity`, **DV** `/docs/animate-view`. Their five runnable examples and displayed source are registered in `src/lib/site/examples/presence-view-examples.ts`; the example source is the displayed code's only source of truth.

- **PM** `parity-presence-model.spec.ts`: keyed reconciliation, duplicate keys, initial records, generation guards, registrations and disposal.
- **PS** `parity-presence.spec.ts`: retained list/nested/hidden-Activity SSR and no server effects.
- **PB** `parity-presence.svelte.spec.ts`: seven list, key, wait, custom, manual, nesting and pop restoration cases.
- **MB** `parity-managed-presence.svelte.spec.ts`: direct motion descendants, no duplicate native outro, custom/reversal, wait/initial, Activity repeat suspension and late descendants.
- **AB** `parity-activity.svelte.spec.ts`: three retained-input/effect, initially-hidden and rapid-reversal cases.
- **CB** `parity-composition.svelte.spec.ts`: Activity late children, ancestor/local hidden controls, path ownership and live policy; detailed outcomes in [composition results](./COMPOSITION-RESULTS.md).
- **CC** `parity-core-contracts.svelte.spec.ts`: includes `presenceAffectsLayout` measurement invalidation.
- **VB** `parity-view.svelte.spec.ts`: browser enter/exit/update/share, types/async, cancellation, nesting, duplicates, failure cleanup, multiple roots and custom controls.
- **VM** `parity-view.spec.ts`, `parity-view-resources.spec.ts`, `parity-view-navigation.spec.ts`, `parity-view-ssr.spec.ts`: coordinator/model, resource waits, Kit adapter and wrapperless SSR.
- **DB** `parity-presence-view-docs.svelte.spec.ts`: all five canonical demos exercised through their public imports.

**Verified** means the named assertion ran successfully during integration; **Implemented / further gate** names additional cases that the focused suite does not establish. These are verification gaps, not declarations of complete parity. Root reported the integrated View suite passing Chromium, Firefox and WebKit. PB/AB and docs passed their focused browser runs; the root's release matrix supplies the final consolidated browser evidence.

## AnimatePresence contract matrix

| ID / behavior             | Reference / baseline     | Implemented Svelte API and behavior                                                                                                          | Tests and docs                                                               | Status / precise remaining difference                                                                                                                                                    |
| ------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01 conditional retention | P-D/P-S, 13.4.4          | `present={open}` retains the record until all registered motion descendants and manual holders finish.                                       | MB, PM; DP conditional demo                                                  | Verified; explicit data boundary replaces React child enumeration.                                                                                                                       |
| P02 keyed replacement     | P-S, 13.4.4              | `items` plus `key` keeps a same-key record and updates its live data; new keys mount separately.                                             | PB same-key input/node test, MB wait replacement; DP                         | Verified.                                                                                                                                                                                |
| P03 list retention/order  | P-S, 13.4.4              | Reconciliation keeps surviving identities and outgoing data in order; duplicate keys throw.                                                  | PM, PB `[a,b,c]` to `[d,a,c]`; DP list demo                                  | Verified.                                                                                                                                                                                |
| P04 default mode          | P-S, 13.4.4              | `AnimatePresence` defaults to `sync`; existing `Presence` retains its `wait` default.                                                        | PB default case, existing presence lifecycle; DP migration note              | Verified; intentional compatibility distinction.                                                                                                                                         |
| P05 sync mode             | P-S, 13.4.4              | Enter immediately; retain every outgoing record; complete the exit batch once.                                                               | PM/PB simultaneous manual exits and list changes; DP                         | Verified.                                                                                                                                                                                |
| P06 wait mode             | P-S, 13.4.4              | One active item, latest pending replacement; multiple items give an actionable error.                                                        | PM/PB/MB; DP sequencing demo                                                 | Verified; Astra throws for unsupported multi-item wait rather than React's development warning.                                                                                          |
| P07 initial suppression   | P-S, 13.4.4              | `initial={false}` applies to the first committed subtree only; later records and descendants enter.                                          | PM/PS/MB late-child test; CB Activity counterpart; DP                        | Verified first mount/SSR/late descendants; release hydration gate remains separate.                                                                                                      |
| P08 custom exit data      | P-S, 13.4.4              | Reactive `custom` and `usePresenceData<T>().current`; exit resolvers receive the latest boundary data.                                       | PB wait/custom changes, MB directional exit; DP                              | Verified.                                                                                                                                                                                |
| P09 presence state        | P-S, 13.4.4              | `useIsPresent().current`; outside a boundary it is true.                                                                                     | PM/PS/PB retained output; DP helpers reference                               | Verified; getter object preserves Svelte reactivity.                                                                                                                                     |
| P10 manual removal        | P-S, 13.4.4              | `usePresence()` exposes `isPresent` and a generation-captured `safeToRemove`; unregister releases destroyed holders.                         | PM/PB stale callback, simultaneous holders and disposal; DP                  | Verified.                                                                                                                                                                                |
| P11 nested shielding      | P-D/P-S, 13.4.4          | Nested boundary defaults to `propagate={false}` and shields its descendants from an ancestor's managed exit.                                 | PB nested shielding; DP nesting                                              | Verified manual-holder composition; further direct-motion nesting regression gate is explicit.                                                                                           |
| P12 propagation           | P-S, 13.4.4              | `propagate` makes a nested boundary one parent participant and coordinates its retained records.                                             | PB nested propagation; PM registration/disposal; DP                          | Verified nested holder; empty and repeated nested reversal deserve release regression coverage.                                                                                          |
| P13 completion            | P-S, 13.4.4              | `onExitComplete()` has no arguments; runs once for a completed batch, using the current callback and suppressing owner teardown.             | PM/PB/MB; existing Presence lifecycle; DP                                    | Verified; old Presence callback order remains unchanged. Managed removal can be scheduled in the same reactive flush, so callbacks must not assume the removed DOM is already destroyed. |
| P14 no animated children  | P-S, 13.4.4              | Empty participants complete in a microtask after registrations settle; no timeout.                                                           | PM/PS; DP manual/plain children                                              | Verified model; retained plain roots use `presenceRoot()`.                                                                                                                               |
| P15 re-entry              | P-X, 13.4.4              | Same-key re-entry clears exit priority, retains nodes and ignores stale completions.                                                         | PM/PB generation reversal, MB live motion reversal; DP                       | Verified interruption; completed-but-held visual re-entry is a further adversarial composition gate.                                                                                     |
| P16 orchestration         | P-X, 13.4.4              | Managed exits use the existing engine animation state, variant inheritance and child sequencing.                                             | MB descendant completion; preserved coordinated-presence suites; DP variants | Implemented; retain the full before/after/stagger regression gate.                                                                                                                       |
| P17 pop layout            | P-S, 13.4.4              | `mode="popLayout"` registers motion roots automatically; `presenceRoot()` forwards plain/custom roots; style ownership restores on reversal. | PB measured reflow/style restoration, DB list; DP                            | Verified normal flow/reversal; transformed/fixed/scroll combinations remain release layout gates.                                                                                        |
| P18 anchors               | P-S types/source, 13.4.4 | `anchorX` left/right and `anchorY` top/bottom, default left/top; automatic RTL resolves horizontal anchoring.                                | presence-pop implementation; DP complete prop reference                      | Implemented / further gate: explicit RTL, right/bottom resize and fractional geometry browser assertions.                                                                                |
| P19 stylesheet root/nonce | P-S, 13.4.4              | `root` controls style insertion; explicit nonce overrides MotionConfig nonce; cleanup owns only its rules/markers.                           | PB reversal restores authored style; DP props                                | Implemented / further gate: dedicated ShadowRoot and CSP nonce browser assertions.                                                                                                       |
| P20 layout integration    | P-S, 13.4.4              | `presenceAffectsLayout=true` adds measurement invalidation; false omits the artificial hint. Real DOM layout mutations remain detectable.    | CC invalidation test; preserved coordinated layout suites; DP                | Verified hint behavior. This is React context-identity rerender intent expressed through Svelte layout measurement, not suppression of actual layout changes.                            |
| P21 lifecycle/SSR         | P-S, 13.4.4              | SSR retains deterministic records; DOM measurement occurs only client-side; scope and node registration cleanup is idempotent/refcounted.    | PS/PM/PB owner disposal; DP SSR/lifecycle                                    | Verified server/model/disposal; complete packed-consumer hydration gate remains root-owned.                                                                                              |
| P22 exit transitions      | P-X engine, 13.4.4       | Managed exits use animateTarget and engine transitions; legacy native finite-timeline restrictions are not imposed on the new boundary.      | MB managed engine path; DP transitions/troubleshooting                       | Implemented / further gate: explicit finite-repeat and intrinsic/variable-target exit assertions. Infinite repeat cannot complete naturally.                                             |
| P23 priority/callbacks    | P-X, 13.4.4              | Managed exits run above gesture priorities and report actual animation definitions; final removal suppresses a second native outro.          | MB exact leave completion once; preserved gesture and ownership suites; DP   | Verified normal exit callbacks; exit-during-drag/viewport combined gate remains explicit.                                                                                                |

## AnimateActivity contract matrix

The public alpha contract is A-D; React 19.3.0 A-S establishes the native lifecycle comparison. No private Motion+ implementation was available, so undocumented alpha behavior is not presented as observed fact.

| ID / behavior           | Reference              | Implemented Svelte API and behavior                                                                                                       | Tests and docs                                                                        | Status / precise difference                                                                                                      |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A01 visibility          | A-D                    | `mode="visible"` default; visible/exiting/hidden phases; `onExitComplete` after coordinated exit.                                         | AB/MB; DA                                                                             | Verified.                                                                                                                        |
| A02 retained state      | A-D/A-S                | Stable child/host identity across hiding; `as` cannot change while mounted.                                                               | AB native input and node identity; CB state/frame composition; DA retained-input demo | Verified.                                                                                                                        |
| A03 first hidden render | A-S                    | Hidden SSR markup retains content; no Astra-owned work starts until visible.                                                              | PS, AB, MB, CB late-hidden child; DA SSR                                              | Verified; ordinary Svelte lifecycle follows the approved adaptation.                                                             |
| A04 exit sequencing     | A-D                    | Presence scope waits for registered descendants/manual work before hiding; work stays active through exit.                                | AB/MB; DA presence composition                                                        | Verified descendant/manual completion; full variant orchestration gate shared with P16.                                          |
| A05 preserved layout    | A-D                    | `layoutMode="preserve"` default retains flow through exit and removes it on final hide.                                                   | AB verifies display through exit; DA                                                  | Implemented / further gate: independently measured sibling layout timing.                                                        |
| A06 popped layout       | A-D                    | `layoutMode="pop"` reuses pop root measurement/ownership; reveal restores popped roots.                                                   | shared P17 primitive; DA layout reference                                             | Implemented / further gate: Activity-specific pop/reversal and nested scrolling assertions.                                      |
| A07 application effects | A-S                    | `useActivity()` gives mode/phase/active; `useActivityEffect` cleans up at hide and restarts at reveal. Ordinary `$effect` remains active. | AB exact setup/cleanup and ordinary-effect assertions; DA                             | Verified approved Svelte adaptation; no transparent arbitrary-effect suspension.                                                 |
| A08 owned work          | A-S                    | Common activity reader composes parents; motion/time/frame/observers/controls suspend after hiding.                                       | MB repeats, CB frames and hidden control starts, values lifecycle suite; DA           | Verified representative owned work; remaining cross-subsystem checks stay in the release matrix.                                 |
| A09 scheduler/hydration | A-R/A-S                | No emulated React hidden-priority scheduler or selective hydration; ordinary Svelte SSR/hydration.                                        | PS/AB; DA explicit difference                                                         | Agreed adaptation.                                                                                                               |
| A10 reversal            | A-D retained guarantee | Re-entry cancels stale hiding and preserves state; no exit completion for an interrupted hide.                                            | AB rapid reversal, PM generations; DA                                                 | Verified Astra contract; alpha's undocumented callback edge behavior remains unqualified.                                        |
| A11 nesting/focus       | A-S                    | Effective activity is parent AND local activity. Host becomes inert when hiding is requested and removes inert on reveal.                 | AB inert assertions; shared activity reader; DA accessibility                         | Implemented / further gate: nested keyboard focus and independently hidden child browser case. No unsolicited focus restoration. |
| A12 teardown            | A-S                    | Final unmount destroys scopes and activity-aware cleanup once; stale generations cannot resurrect children.                               | AB unmount cleanup, PM disposal; DA                                                   | Verified.                                                                                                                        |

## AnimateView contract matrix

Motion 13.4.4 V-S defines layer behavior; React 19.3.0 V-C defines coordination. Astra uses public Svelte APIs and native View Transitions, with no React runtime dependency.

| ID / behavior         | Reference                  | Implemented Svelte API and behavior                                                                                                              | Tests and docs                                                            | Status / precise difference                                                                                          |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| V01 imports           | V-S                        | `AnimateView` and `startViewTransition` root exports; Kit adapter isolated at `astra-motion/view-navigation`.                                    | VM SSR/navigation; DV                                                     | Implemented; final packed plain-Svelte dependency/type check is root-owned.                                          |
| V02 roots             | V-R                        | Wrapperless `children(view)` snippet, `{@attach view}` on each root; generated identities and multiple roots.                                    | VM SSR; VB multiple-root callback; DV                                     | Verified approved Svelte attachment adaptation.                                                                      |
| V03 classifications   | V-C                        | Registry snapshots classify enter/exit/update/share and prune nested-boundary-only mutations.                                                    | VM classification/geometry; VB all types/nesting; DV                      | Verified.                                                                                                            |
| V04 default timing    | V-S                        | Default duration 0.3 seconds; native effect timing updated through the shared DOM engine.                                                        | VB actual native timings; DV transition reference                         | Verified.                                                                                                            |
| V05 targets           | V-S                        | enter/exit/update/share accept CSS targets or `(types) => target`; custom properties replace relevant crossfade layers.                          | VB custom keyframes/controls; DV                                          | Verified CSS transform/clipPath/opacity. Transform aliases and transitionEnd are not advertised for pseudo-elements. |
| V06 opacity           | V-S                        | Scalar enter opacity begins at 0; other types begin at 1; arrays retain authored keyframes.                                                      | view-animation implementation and VB custom layer case; DV                | Implemented; dedicated null-origin edge comparison remains a review gate.                                            |
| V07 layers            | V-S                        | New layer for enter; old for exit/update/share; geometry retained.                                                                               | VB pseudo-element assertions; DV                                          | Verified.                                                                                                            |
| V08 merges            | V-S                        | Type-specific transition, per-property options and separate `transition.layout`; generator timings supported.                                    | VB timing and custom options; DV prop/default reference                   | Implemented; repeat semantics of browser-owned geometry are not broadened beyond source.                             |
| V09 named sharing     | V-S                        | Name pairs by document; entering options win; collision-safe encoding and duplicate-name diagnostic.                                             | VM incoming props, VB shared and duplicate cases; DV shared demo          | Verified.                                                                                                            |
| V10 contextual types  | V-S/V-R                    | Helper `types` and update-context `addType`; per-transaction type snapshot reaches resolvers.                                                    | VM queued/async types; VB async resolver; DV                              | Verified Svelte coordinator API.                                                                                     |
| V11 start callbacks   | V-S                        | `onAnimationStart(controls,type)` receives grouped controls, including multiple roots.                                                           | VB group speed/time/pause/custom controls; DV                             | Verified; errors surface and release owned state.                                                                    |
| V12 completion        | V-S                        | `onAnimationComplete(type)` on successful active completion; suppressed after cancel/teardown.                                                   | VB cancel and rejection cleanup; DV                                       | Verified.                                                                                                            |
| V13 async content     | V-C                        | Async update callback awaited, then Svelte tick; visible newly introduced images/fonts wait up to 500ms. Errors reject update/finished promises. | VM resource waits/timeout/listener cleanup; VB async/rejection; DV        | Verified explicit async transaction adaptation; no emulated React Suspense scheduler.                                |
| V14 concurrency       | V-R                        | Default queue serializes captures and batches pending callbacks without dropping writes; replace aborts previous capture and signals async work. | VM queued order, replace and cancel-before-update; DV                     | Verified. Cancellation is cooperative for async application work and never rolls committed state back.               |
| V15 fallback          | V-C                        | Unsupported/throwing native APIs still apply updates once; outcomes finished/skipped/unsupported; no invented animation callbacks.               | VM absence/start failure/cancel races; VB failure cleanup; DV             | Verified.                                                                                                            |
| V16 ownership         | V-C                        | Restore authored names/priorities and empty style attributes only while still owned; remove reset styles on last owner.                          | VB name restoration and rejection; VM ownership failures; DV              | Verified.                                                                                                            |
| V17 presence/activity | V-C                        | Registry excludes absent managed records, hidden Activity and outgoing/inert DOM snapshots.                                                      | registry context integration; legacy route presence suite; DV composition | Implemented / further gate: combined managed Presence + Activity + named shared view fixture.                        |
| V18 reduced motion    | V-S source reads no config | Astra inherits policy; default never matches motion components; explicit always/user can skip capture while applying state.                      | VM reduced capture; root core/value live-policy suites; DV                | Documented Astra extension. A live policy change during active native capture remains a targeted review case.        |
| V19 CSP/styles        | V-S reset lifecycle        | Scoped/refcounted reset ownership and nonce propagation; component/helper nonce inputs.                                                          | VM/ VB cleanup after errors/cancel; DV nonce                              | Verified owned cleanup; dedicated CSP-enforced document assertion remains a release gate.                            |
| V20 Kit navigation    | V-C router integration     | `useViewTransitionNavigation` delegates navigation.complete through the same coordinator; abort and teardown release waits.                      | VM SSR/ordering/duplicate coordinator/abort; DV dedicated import example  | Verified adapter model; real Kit history/redirect/load e2e belongs to root deployment verification.                  |

## Source/document discrepancies and limits requiring explicit treatment

- The Presence page mentions `useIsPresence` in prose, but its example and stable
  exports use **`useIsPresent`**. Use the exported name.
- Stable Presence source/types include `anchorX`, `anchorY`, and
  `presenceAffectsLayout`; the current article does not document them. Include
  working options in Astra's reference rather than silently omitting them.
- AnimateView documentation describes its animation basis as the mini animate
  function. The stable implementation directly enumerates native view layers,
  updates their timing, and constructs `NativeAnimation`/`GroupAnimation` for
  replacements. Reusing that DOM-only mechanism is appropriate; importing the
  React wrapper is not.
- AnimateView's public target type is broad (`TargetAndTransition`) but the
  inspected replacement loop treats every key except `transition` as a CSS
  property. It does not specially implement transform aliases or transitionEnd.
  Do not advertise `x`, `y`, or transitionEnd as verified view-layer capabilities
  merely because the type accepts them. Use real CSS `transform`/`clipPath` in
  examples and test any extensions deliberately.
- “All transition options” is broader than the native layer retiming code:
  existing browser layers are updated with delay, duration and easing derived
  through generator options. Do not infer loop/repeat semantics for browser
  geometry layers without testing them. Custom property animations use a
  different NativeAnimation path.
- View snapshots are not interruptible springs. React queues its own view
  transitions, whereas existing Astra routes cancel the previous transition.
  Both are valid policies with different visible behavior; generic parity and
  backward-compatible route behavior need separate documented choices.
- Activity remains an alpha documentation contract. Its private version/source
  is not available in this audit; callback defaults, undefined mode edge cases,
  and interruption details beyond public guarantees remain unqualified. Astra
  must define and test its own coherent behavior without labeling guesses as
  measured upstream behavior.
- Existing `Presence` completes after Svelte destroys the outgoing group, before
  mounting the next wait value. A new managed boundary may acknowledge animations
  while DOM is still mounted. Specify callback/DOM order and test it; preserve
  existing `Presence` tests and behavior.

## Existing evidence to preserve

| Files                                                                                    | Actual assertions inspected                                                                                                                                                      | What they do not establish                                                |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/motion-lab/presence-lifecycle.spec.ts`, `review-presence.spec.ts`               | Deterministic SSR value, empty snippet, no exit completion on server destruction                                                                                                 | New boundaries, hidden activity hydration                                 |
| `src/lib/motion-lab/presence-lifecycle.svelte.spec.ts`                                   | Nested final removal, wait/sync timing, rapid reversal identity, latest callback/destination, mode reset, signed zero identity, owner disposal suppression                       | Keyed data lists, manual holders, custom data, nested shielding/propagate |
| `src/lib/motion-lab/presence-state.svelte.spec.ts`                                       | Per-property delay/keyframes/colors, transitionEnd timing, finite springs, no-op duration, asymmetric reversal and native clock handoff                                          | General engine repeated exits or a context-driven managed path            |
| `src/lib/motion-lab/coordinated-presence.spec.ts`, `coordinated-presence.svelte.spec.ts` | Inherited initial/initial=false SSR, before/after/stagger, reversal and live reduced-motion settling                                                                             | Boundary-managed context registration and callbacks                       |
| `src/lib/motion-lab/review-coordinated.svelte.spec.ts`                                   | Wait sequencing plus pop layout/shared group and owner disposal                                                                                                                  | Full LayoutGroup component contract or RTL anchor options                 |
| `src/lib/motion/routes.spec.ts`                                                          | Kit release order, duplicate identities/scopes, cancellation races, promise rejection, unsupported API, SSR, ownership/listener cleanup, live policy, authored-name preservation | Actual native animation layer timing/config/callbacks                     |
| `src/lib/motion-lab/route-presence-review.svelte.spec.ts`                                | Native retained outgoing sources, inert sources, plain roots retained by siblings, listeners and name restoration                                                                | New managed presence/activity eligibility                                 |
| `tests/motion/routes.spec.ts`                                                            | Authored browser tests for SSR/hydration/history, reduced motion, important CSS names, async navigation and supersession                                                         | A fresh execution in this audit, ordinary-state AnimateView               |

## Delivery state and remaining release gates

Runtime integration is complete for the APIs described above, with the explicit adaptations and narrowly named further gates retained in the row status. Root has integrated the components, helpers, canonical examples and public exports. The current parity package baseline is Motion/framer-motion/motion-dom 13.4.4 and motion-utils 13.3.0, and the published graph must remain React-free.

The final release record must attach the consolidated SSR/strict-type/browser results, packed consumer SSR/hydration and tree-shaking qualification, independent adversarial findings and fixes, review of the further gates named in this matrix, merge/CI/deployment results, and deployed example checks. No accepted prop alone closes a behavioral gate. Historical native Presence and route suites remain meaningful regression coverage alongside the new managed contracts.

The related [runtime composition report](./COMPOSITION-RESULTS.md) records the later Activity/control/factory/arc corrections. The [official arc reference](https://motion.dev/docs/arc), reread 2026-09-28, explicitly includes direct components, animate and useAnimate and excludes mini. Its all-transition wording includes sequences. The separate composition increment implements path-bearing segments, with the exact engine sampler and per-element ownership under one coordinated sequence group; its decisive Chromium case and the independent reviewer's ownership finding/resolution are recorded in the composition report. The root final matrix still supplies the cross-engine release qualification.
