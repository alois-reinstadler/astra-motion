# Gesture, drag, reorder, and layout parity matrix

Current integration qualification: [final verification](VERIFICATION.md),
[installed package](PACKAGE-RESULTS.md), [independent review](ADVERSARIAL-REVIEW.md).
The dated worker checkpoints below retain their original execution scope; the final
record closes their source, package and documentation integration gates. Remote
CI/Pages outcomes qualify the merged delivery revision.

Upstream reference date: **2026-09-27 UTC**. Implementation/evidence update:
**2026-09-28 UTC**. Astra started at `b66e376`; this matrix describes the current
integrated parity candidate, not a released tag. Final package-consumer,
three-browser, independent-review and deployment qualification remains with the
root maintainer. An implemented export is not treated as verification.

## Baseline and references

| Package         | Starting Astra baseline | Candidate/reference baseline              |
| --------------- | ----------------------- | ----------------------------------------- |
| `motion`        | 13.4.3                  | 13.4.4                                    |
| `framer-motion` | 13.4.3                  | 13.4.4, development/source reference only |
| `motion-dom`    | 13.4.2                  | 13.4.4                                    |
| `motion-utils`  | 13.3.0                  | 13.3.0                                    |
| `svelte`        | 5.57.0 package baseline | 5.57.0 package baseline                   |

The 13.4.4 registry distributions identify upstream commit
`636e725fc71315ca91ff196eb09685017e2fe0c8`; motion-utils identifies
`16cf742d9fad846f8b3a91a86d57f6b5757c8c5e`. Published JS and embedded TypeScript
source maps were inspected. Reorder and LayoutGroup files are byte-identical
between the initial framer-motion 13.4.3 installation and 13.4.4. PanSession
13.4.4 adds pending-final-move flushing and `time.now()` samples; cursor snapping
measures the live viewport box. The candidate follows those behaviors. Runtime
adapters import the single compatible DOM engine; no React runtime is introduced.

Official articles read in full:

- [Gesture overview](https://motion.dev/docs/react-gestures) (G).
- [Drag](https://motion.dev/docs/react-drag) (D).
- [Hover](https://motion.dev/docs/react-hover-animation) and [hover recognizer](https://motion.dev/docs/hover) (H).
- [useDragControls](https://motion.dev/docs/react-use-drag-controls) (C).
- [Reorder](https://motion.dev/docs/react-reorder) (R).
- [LayoutGroup](https://motion.dev/docs/react-layout-group) (LG).
- [Layout animation](https://motion.dev/docs/react-layout-animations) (L).
- [Motion component](https://motion.dev/docs/react-motion-component) (M), including all gesture/layout options.
- [arc](https://motion.dev/docs/arc) (A), followed from the layout reference.

Source references below are relative to the fixed upstream commit:

- [Drag controls](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/drag/VisualElementDragControls.ts) (SD).
- [Pan session](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/pan/PanSession.ts) (SP).
- [Constraint utilities](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/drag/utils/constraints.ts) (SC).
- [Public controls](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/drag/use-drag-controls.ts) (SCTRL).
- [Hover feature](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/hover.ts), [press feature](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/press.ts), [pan feature](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/gestures/pan/index.ts) (SG).
- [Reorder group](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/Reorder/Group.tsx), [item](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/Reorder/Item.tsx), [ordering](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/Reorder/utils/check-reorder.ts), [axis detection](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/Reorder/utils/detect-axis.ts), [scrolling](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/Reorder/utils/auto-scroll.ts) (SR).
- [LayoutGroup implementation](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/components/LayoutGroup/index.tsx), [measurement lifecycle](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/framer-motion/src/motion/features/layout/MeasureLayout.tsx), [projection groups](https://github.com/motiondivision/motion/blob/636e725fc71315ca91ff196eb09685017e2fe0c8/packages/motion-dom/src/projection/node/group.ts) (SL).

Every reference code in the following matrices resolves to the exact baseline
above. “Verified” means the named focused assertions passed at the checkpoint
below; it does not mean every possible composition or the final release passed.
“Source reviewed” identifies a specific branch without a dedicated assertion.

## Resolved discrepancies and Svelte adaptations

1. **Elasticity:** M describes `0.5`; SC/SD implement **0.35**, including
   `dragElastic={true}`. Astra uses 0.35, tests the actual displacement, and
   explains the discrepancy on `/docs/drag#constraints`.
2. **Recognition versus direction selection:** C conflates the configurable
   recognition threshold with direction locking. SP recognizes at 3px by
   default; SD selects a direction only above **10px**, checking y first and
   skipping the pose update on that selection frame. Both thresholds are
   implemented and documented.
3. **Primary cancellation policy:** `motion.*` follows upstream native
   `pointercancel`: flush the pending last move, end the drag, and run configured
   release inertia. Explicit `controls.cancel()` omits end/inertia;
   `controls.stop()` releases normally. Window blur, disablement and removal
   cancel safely. Reduced-motion policy does not independently suppress primary
   drag inertia. Existing `createMotion` bindings retain their earlier native
   cancellation/reduced-motion suppression behavior, documented as compatibility.
4. **Pointer tracking:** SP tracks the pointer on window without capturing it.
   The final candidate does the same for `motion.*`. Explicit capture and
   lost-capture cancellation remain only in legacy bindings. Capturing the primary
   Reorder item caused a real failure: Svelte's keyed DOM move released capture
   after the first swap and cancelled later movement. Root corrected this and
   reports the installed consumer now performs two consecutive trusted swaps.
5. **Hard release bounds:** Astra preserves its existing clamped inertia target
   when elasticity is false, avoiding the upstream generator's initial overshoot.
   This deliberate difference is documented; elastic rebound uses engine defaults.
6. **Svelte element access and lifecycle:** `bind:ref` replaces React element refs;
   native elements, `{ current }`, and getters are accepted where element inputs
   are needed. Stable getters may read reactive state. `useDragControls()` is an
   ordinary SSR-safe factory; the attached element owns its subscription and work.
7. **Reorder:** controlled `values`/`onReorder`, generic values and keyed Svelte
   each blocks replace React child reconciliation. There is no `bind:values`
   shortcut. Current upstream supports automatic x/y/xy detection, wrapped rows,
   RTL in the xy branch and edge scrolling. No extra auto-scroll tuning props are
   invented. Astra owns scroll state per group, includes a self-scrolling group,
   and accounts for clipping; these improve upstream's module-global ownership.
8. **LayoutGroup:** snippets and context replace React children/context. Native
   Svelte invalidation and observation transactions coordinate geometry. Group
   `id`/`inherit` define identity for that mount; key the group to replace them.
   Direct layout props remain primary, with supported attachment/controller APIs.
9. **Coordinate helpers:** `correctParentTransform` handles invertible 2D axes,
   including independent CSS rotate/scale and computed transform. It is not a
   general 3D/perspective inverse. `transformViewBoxPoint` uses inverse screen CTM,
   including viewBox origin, letterboxing and ancestor transforms; unresolved or
   singular matrices return the input point.
10. **Arc:** current A prose disagrees with its quadratic implementation.
    `strength` displaces the control point, so a symmetric midpoint reaches half
    `strength × distance`; `peak` positions the control point rather than naming
    an exact peak-progress value. Source behavior, the 20px minimum distance,
    authored rotation composition and reversal are tested and documented.
11. **CSS selection preservation:** upstream disables selection while dragging.
    Astra additionally preserves distinguishable authored policies. WebKit can
    report default selection and stylesheet `text` identically; explicit inline
    `user-select:text` preserves that intent. The drag page documents this browser
    limitation. It is a limit of the preservation extension, not a parity gap.
12. **Stale layout article:** L's claim that View Transitions might be exposed in
    the future conflicts with the published AnimateView reference. Dedicated
    AnimateView research and implementation take precedence, in its own matrix.

## Evidence key

All paths in this table are under `src/lib/motion-lab/`.

| Key      | Test file(s) and meaningful assertions                                                                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1       | `gestures.svelte.spec.ts`: 16 existing cases, including touch hover filtering, tap/keyboard/disabled behavior, viewport entry/leave, locks/constraints, inertia, native legacy capture, teardown and MotionValue composition.                                                                         |
| G2       | `gesture-aftercare.svelte.spec.ts`: 9 cases for repeated keyboard attachment, Space/native click, invalid live bounds, blur and disposal from callbacks.                                                                                                                                              |
| PG       | `parity-gestures.svelte.spec.ts`: 9 original cases for controls, exact elasticity, direction lock, child tap cancellation, propagation, constraint resize/replacement, stationary scroll and coordinate helpers; root adds a tenth focus-transfer case.                                               |
| GP       | `parity-gestures.spec.ts`: 5 pure cases for elasticity, invalid inputs, SSR-safe control routing/unsubscription and element resolution.                                                                                                                                                               |
| PD       | `parity-primary-drag.svelte.spec.ts`: 10 cases for primary native cancellation, pending moves, explicit cancellation, blur/capture policy, skip-animation policy, live axis changes and authored style ownership. Root updates the capture case for final window tracking.                            |
| GC       | `parity-gesture-contracts.svelte.spec.ts`: 10 new public-component cases covering global taps/current callbacks/teardown, three nested-axis/propagation scenarios, returned/original measured bounds, live cursor snapping, viewport once/reactive root cleanup and trusted SVG dragging through CTM. |
| RD       | `parity-reorder.svelte.spec.ts`: 8 cases for controlled lists/tags/handles, wrapped grids, sibling insertion/removal, live axis changes, stationary edge scrolling, removal cleanup and three focus-intent cases.                                                                                     |
| RP       | `parity-reorder.spec.ts`: 6 cases for automatic axes, unequal geometry, velocity-gated ordering, object identity, wrapped rows, nearest boxes and explicit xy RTL.                                                                                                                                    |
| PL       | `parity-layout.svelte.spec.ts`: 4 cases for dependency gating and previous/current boxes, persistent crossfade=false, anchor updates and drag-only measurement policy.                                                                                                                                |
| ARC      | `parity-layout-path.spec.ts` (3) and `parity-layout-path.svelte.spec.ts` (2): curve geometry, direction/reversal, rotation, minimum distance, normal/shared paths and incoming transition preservation.                                                                                               |
| GD       | `parity-gestures-docs.svelte.spec.ts`: 8 interactions against the actual canonical gesture/control/Reorder/layout/group example components.                                                                                                                                                           |
| GS       | `parity-gestures-docs.spec.ts`: 11 server checks for public-import client/SSR compilation, complete inline snippets and one primary registration per canonical example.                                                                                                                               |
| L1/L2/L3 | `layout.svelte.spec.ts`, `layout-review.svelte.spec.ts`, `automatic-layout.svelte.spec.ts`: established projection, shared-layout, policy and invalidation regressions.                                                                                                                               |
| B        | `projection-boundaries.svelte.spec.ts`: existing transformed external ancestors and nested sticky/scroll/clipping geometry matrix.                                                                                                                                                                    |
| RC       | Root-owned `parity-core-contracts.svelte.spec.ts`, `parity-core.svelte.spec.ts`, `parity-managed-presence.svelte.spec.ts`: gesture priority, SVG, presence measurement hints, retained exits and activity ownership. Final integrated result belongs to the root report.                              |

## Gesture and drag matrix

The public implementations live in `base-gestures.ts`, `press.ts`,
`drag-gestures.ts`, `drag-controls.ts`, `coordinates.ts`, with the shared live-prop
bridge in `motion-core.svelte.ts`. G1/G2 APIs remain supported. The original
baseline lacked the new options below; this table records their current state.

| Feature, option or observable behavior         | Upstream      | Current Svelte API/implementation                                                                                                                                                      | Tests                                                                                                                              | Documentation/example                                                                               | Status and precise remaining difference                                                                                 |
| ---------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hover target, variant labels and inheritance   | G/H/SG        | Direct `whileHover`; engine state arbitration and descendants.                                                                                                                         | G1, GD hover example; RC tap > hover > animate.                                                                                    | `/docs/gestures#composition`, `/docs/hover`; `ParityGestureHover.svelte`.                           | Verified focused. Full exit/drag priority uses the shared engine; integrated qualification recorded in VERIFICATION.md. |
| Hover callbacks and timing                     | H/SG          | `(PointerEvent, {point})` uses page coordinates; activation is immediate, callback is postRender and reads live options.                                                               | G1 deferred lifecycle; GD native hover.                                                                                            | `/docs/hover` callback/lifecycle sections.                                                          | Implemented/verified basic timing.                                                                                      |
| Hover filtering and deferred leave             | H/SG          | Engine recognizer filters touch and active drag; pressed leave waits for release. Teardown removes listeners and queued callbacks.                                                     | G1 filtering/cleanup; G2 press cleanup.                                                                                            | `/docs/hover#callbacks`, troubleshooting.                                                           | Engine contract reused; deferred-leave branch source reviewed.                                                          |
| Standalone `hover`                             | H             | Public engine export accepts selector, element or elements; returns cleanup; start may return end; passive=true, once=false.                                                           | Engine source plus public compile/import coverage.                                                                                 | `/docs/hover`, smallest native-element example.                                                     | Implemented; selector/array/abort combinations are source-reviewed, not separately exercised by owned browser cases.    |
| Tap primary pointer, containment, cancellation | G/SG          | Direct whileTap/onTapStart/onTap/onTapCancel; page points and deferred callbacks; unrelated pointers ignored.                                                                          | G1/G2; PG nested tap cancellation.                                                                                                 | `/docs/gestures#callbacks`, `/docs/motion`.                                                         | Verified. Native click is preserved.                                                                                    |
| Enter, Space and focus accessibility           | G/SG          | Enter drives pointer-like tap lifecycle; generated tabindex only when needed; focus/blur cleanup. Space adds feedback without synthesizing click.                                      | G1/G2 native/disabled/repeated handlers; GD native click.                                                                          | `/docs/gestures#accessibility-and-lifecycle`, accessibility guide.                                  | Verified; Space behavior is an Astra extension. SVG keyboard and legacy selector fallback are source-reviewed branches. |
| Nested tap propagation                         | G/M/SG        | `propagate={{tap:false}}` claims only gesture participation; native events still bubble.                                                                                               | PG parent/child and native listener assertion.                                                                                     | `/docs/gestures#composition`.                                                                       | Verified.                                                                                                               |
| Global tap target                              | SG/types      | `globalTapTarget=false`; true listens on window and accepts release outside the element. Reactive option replacement tears down old registration.                                      | GC exact deferred order, current callback closure, true/false switch and queued-work teardown.                                     | `/docs/gestures#callbacks`, motion reference.                                                       | Verified Chromium; integrated qualification recorded in VERIFICATION.md.                                                |
| Focus-visible target                           | G/SG          | `whileFocus`; matches focus-visible, fallback when selector unsupported; clears on blur.                                                                                               | G1 focus/blur; GD focus/native buttons.                                                                                            | Gestures overview and accessibility.                                                                | Verified modern-browser path; exception fallback source reviewed.                                                       |
| Pan information and threshold                  | SP/SG         | onPanSessionStart/onPanStart/onPan/onPanEnd receive point/delta/offset/velocity; 3px recognition and 100ms velocity history. Session/start/move update-phase; end postRender.          | G1 pan without transform; G2 callback teardown; PG thresholds; PD final move.                                                      | `/docs/gestures#callbacks`, motion callback table.                                                  | Implemented and focused lifecycle verified; no independent exact 100ms hold/flick comparison is claimed.                |
| Drag axes and defaults                         | D/SD          | `drag=false`, true/x/y; live enabled-axis changes keep the session. Percent origin resolves against the box; editable descendants are ignored.                                         | G1 axes, PD live updates, RD list-to-grid during drag.                                                                             | `/docs/drag#start`.                                                                                 | Verified live axes. Percent origins/editable-descendant branch source reviewed.                                         |
| Native behavior/style ownership                | D/HTML source | Disable native draggable; apply axis touch-action and selection policy; authored replacements survive update/teardown.                                                                 | G1 cleanup, PD stylesheet/inline/important/native policy.                                                                          | Drag browser/lifecycle guidance.                                                                    | Verified with WebKit selection caveat above.                                                                            |
| Numeric constraints                            | D/SC          | Optional finite edge offsets; inverted/nonfinite bounds error; live changes validated.                                                                                                 | G1/G2 hard bounds and invalid live inputs; GP.                                                                                     | `/docs/drag#constraints`.                                                                           | Verified; explicit false disables constraints.                                                                          |
| Element/ref/getter constraints                 | D/SC/SD       | `dragConstraints={element                                                                                                                                                              | {current}                                                                                                                          | getter}`; relative measurements, oversized bounds swap, resize observation and replacement handoff. | PG real getter/resize/replacement; GC raw measured edge values.                                                         | Drag responsive bounds; controls reference. | Verified focused. Unmounted required element produces a descriptive error. |
| Measured-constraints callback                  | SD            | `onMeasureDragConstraints(edges)` returns replacement edges or void; replacement is validated.                                                                                         | GC both returned and original bounds; rendered MotionValues constrained before onDrag.                                             | `/docs/drag` API table, motion callbacks.                                                           | Verified Chromium; integrated qualification recorded in VERIFICATION.md.                                                |
| Elasticity                                     | M/SC/SD       | Boolean, number or partial edge object; default/true=.35; omitted object edges=0; finite range [0,1].                                                                                  | GP exact resolution/errors; PG 120px drag becomes 107px at 100px limit.                                                            | `/docs/drag#constraints`.                                                                           | Verified; upstream doc/source discrepancy is explicit.                                                                  |
| Momentum, transitions and snap-back            | SD            | momentum=true; timeConstant=750, restDelta=1, restSpeed=10, bounce 200/40; dragTransition overrides. false zeroes velocity but still returns elastic overshoot.                        | G1 inertia/interruption/hard destination; PG false+overshoot; PD policy.                                                           | `/docs/drag#release`.                                                                               | Verified core behavior; hard no-overshoot destination is retained Astra extension.                                      |
| Snap to origin                                 | SD            | `dragSnapToOrigin=false`, true/x/y; selected release bounds become zero.                                                                                                               | RD/GD Reorder release; source-reviewed axis restriction and click-only return.                                                     | Drag release/options; Reorder Item contract.                                                        | Implemented; axis-specific interrupted return is not separately asserted by owned cases.                                |
| Direction lock                                 | SD            | `dragDirectionLock=false`; >10px, y before x, `onDirectionLock(axis)` once/session.                                                                                                    | PG exact 7px/10px separation and y result.                                                                                         | `/docs/drag#direction`.                                                                             | Verified source behavior; differs from shorthand in C.                                                                  |
| Nested drag propagation/locks                  | SD            | `dragPropagation=false`; same-axis child claims lock, different axes coexist; true lets ancestor participate.                                                                          | G1 lock; GC three nested cases, callback order and post-unmount inactivity.                                                        | `/docs/drag#direction`.                                                                             | Verified Chromium; integrated qualification recorded in VERIFICATION.md.                                                |
| Handles and controls                           | C/SCTRL/SD    | `dragListener=true`; false requires `.start(event, options)` from an external handle. Controls have no independent frame loop and safely address no/multiple participants.             | GP routing/unsubscribe; PG handle/start threshold/stop/cancel; GD native range alternative.                                        | `/docs/use-drag-controls`; `ParityGestureControls.svelte`.                                          | Verified; reactive participant replacement uses core registration keys.                                                 |
| Cursor snap/default threshold                  | C/SD          | start options snapToCursor=false, distanceThreshold=3; snap uses live box and transformed page point before recognition.                                                               | GC resized 120px box, exact two-axis center, 6px no-start then 12px start; GP option validation.                                   | Controls complete arguments table.                                                                  | Verified Chromium; integrated qualification recorded in VERIFICATION.md.                                                |
| Callback order and interruption                | SD/SG         | Start/move update-phase; visual rendered before onDrag; end after render; transition completion after axes settle, stale generations suppressed.                                       | G2 disposal during start/end; GC bounds+deferred end; PD pending native cancellation.                                              | Drag callbacks and motion reference.                                                                | Verified focused; no completion-after-teardown contract remains.                                                        |
| Point transforms and SVG                       | D/SP          | Config transformPagePoint applies to page stream/constraints/snap. HTML and SVG use their appropriate visual; inverse CTM corrects viewBox and letterboxing.                           | PG CSS scale/helper CTM; GC trusted SVG pointer events, exact actual coordinate delta and rendered screen matrix.                  | Drag coordinate section, SVG cross-link.                                                            | Verified Chromium full SVG drag. 2D helper and unresolved/singular fallback limits are explicit.                        |
| Scroll/layout changes during drag              | SP/SD         | Track window/ancestor scroll; keep stationary-pointer work current; projection geometry changes adjust both origin and pose before callbacks.                                          | PG stationary ancestor scroll/teardown; RD insertion/removal/wrap/self-scroll.                                                     | Drag lifecycle; Reorder scrolling/composition.                                                      | Verified focus set. New combined nested-sticky-plus-drag geometry remains part of final adversarial composition review. |
| Native cancellation/window tracking            | SP/SD         | Primary pointercancel normal release; explicit cancel/blur/disable/remove stop; primary tracking survives native lost capture. Legacy explicit capture behavior remains.               | PD final case updated by root; G1 legacy capture; installed-consumer consecutive swaps reported by root.                           | `/docs/drag#lifecycle`, controls/Reorder cleanup.                                                   | Final primary policy change awaits root combined matrix; installed trusted regression passes.                           |
| Native focus transfer to a handle              | Astra defect  | Window blur listener is noncapturing; ordinary descendant blur cannot cancel a handle's new session. Real window blur still cancels.                                                   | Root-added PG focus-transfer case; installed trusted handle focus reported passing.                                                | Controls native handle and lifecycle prose.                                                         | Implemented/focused consumer evidence from root; absent from older 62-case checkpoint.                                  |
| Viewport options/reactivity                    | M             | root getter/element/ref, once=false, margin=0px, amount=some/all/[0,1]; unavailable observer is a no-op. Root getter is resolved in tracked core effect before queued synchronization. | G1 entry/leave/cleanup; GC actual once disconnect, true→false, root replacement, unchanged DOM identity and old-observer teardown. | Gestures troubleshooting, Scroll concepts, motion API.                                              | Verified Chromium after root getter fix; integrated qualification recorded in VERIFICATION.md.                          |

## Layout and LayoutGroup matrix

Implementation lives in `layout.ts`, `projection-boundaries.ts`, `commit.ts`,
`LayoutGroup.svelte`, layout context and the shared component bridge. These
capabilities compose with the same visual/projection identity as gesture state.

| Feature, option or observable behavior | Upstream                | Current Svelte API/implementation                                                                                                                                                                     | Tests                                                                                                                                 | Documentation/example                                           | Status and precise remaining difference                                                                                             |
| -------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Layout projection/direct modes         | L/M/SL                  | `layout` true, position, size, preserve-aspect, x or y; legacy options object/controllers retained. Transforms animate layout, not authored DOM size.                                                 | L1/L2/L3; GD expanding disclosure; PL direct props.                                                                                   | `/docs/layout#automatic`; `ParityLayoutExpand.svelte`.          | Implemented and existing regression coverage preserved; integrated qualification recorded in VERIFICATION.md.                       |
| Shared IDs without manual controller   | M/SL                    | Direct `layoutId` joins the ambient namespace; ID alone enables shared projection.                                                                                                                    | ARC normal/shared fixture; L1/L2 shared transitions.                                                                                  | `/docs/layout#shared-layout`, motion reference.                 | Verified focused.                                                                                                                   |
| Default and authored layout transition | L/source                | Primary default duration .45/ease [.4,0,.1,1]; per-value `transition.layout` and layoutTransition override; incoming shared destination selects policy. Legacy controller defaults remain compatible. | ARC incoming .8s/curve; PL config updates; root source fix separates authored from projection-mutated props.                          | Layout and transitions pages.                                   | Verified incoming path/duration; no claim that legacy spring default matches primary default.                                       |
| Crossfade and anchor                   | M/projection            | `layoutCrossfade=true`; false survives partial option merges and commits. `layoutAnchor` partial x/y or false reaches projection.                                                                     | PL false across commits/reactive config and anchor object→false.                                                                      | `/docs/layout` advanced options, motion API.                    | Verified forwarding/preservation; detailed nested relative-anchor geometry uses engine behavior and review.                         |
| Dependency and measurements            | M/SL                    | `layoutDependency` compares reference/value; unchanged dependency suppresses ordinary work, while drag/presence geometry still measures.                                                              | PL suppression, previous100/current200 boxes and drag exception; RC presenceAffectsLayout.                                            | Layout measurement section, motion table.                       | Verified targeted corrections; dependency reference is preserved during option snapshots.                                           |
| Measurement/animation callbacks        | Projection public types | onBeforeLayoutMeasure, onLayoutMeasure(current,previous), onLayoutAnimationStart/Complete forwarded. Before may fire without a measure during a shared root transaction.                              | PL checks order per actual measurement; existing L1/L2 animation lifecycle.                                                           | Layout callbacks, motion reference.                             | Source discrepancy resolved: extra before callbacks are upstream behavior, not a one-to-one guarantee.                              |
| Scroll/fixed roots                     | L/SL                    | Direct layoutScroll/layoutRoot, usable for measurement boundaries without layout animation. Existing implicit external boundary correction preserved.                                                 | L2/B fixed/scroll/nested geometry; PL drag-only measure state.                                                                        | Layout advanced/troubleshooting.                                | Existing coverage retained; integrated qualification recorded in VERIFICATION.md.                                                   |
| Scale correction and style ownership   | L/projection            | Engine radius/shadow/child correction composes with Astra ownership/restoration and deletions.                                                                                                        | L1 and existing style/transform ownership suites.                                                                                     | Layout troubleshooting.                                         | Existing implementation preserved; root final regression gates apply.                                                               |
| Independently updating children        | LG/SL                   | `<LayoutGroup>` creates coordinated context without a DOM wrapper; explicit controller remains supported.                                                                                             | GD independent sibling disclosure; L3 observer coordination.                                                                          | `/docs/layout-group`; `ParityLayoutGroup.svelte`.               | Verified focused interaction.                                                                                                       |
| Namespaces and nesting                 | SL                      | id prefixes shared IDs; inherit=true shares namespace/cohort, 'id' shares only namespace, false isolates both. Identity belongs to mount; key for changes.                                            | GD distinct indicator namespaces; source-reviewed cohort identity branches.                                                           | LayoutGroup props/composition; `ParityLayoutNamespaces.svelte`. | Implemented. Full nested true/id/false geometry is a root adversarial-review concern, not claimed by the two-group demo.            |
| Presence/group composition             | SL                      | Managed presence feeds the same projection presence state and retained exits; completion removes registrations.                                                                                       | Root RC managed-presence cases, L1/L2 retained projection.                                                                            | LayoutGroup/AnimatePresence/Reorder links.                      | Integrated; final activity/presence composition verification belongs to root.                                                       |
| SVG layout limitation                  | L                       | SVG attributes/gestures supported; layout projection attaches only to HTML. Animate a wrapping HTML motion element for SVG geometry layout.                                                           | RC SVG attributes/exits; GC actual SVG drag with no projection requirement.                                                           | SVG and Layout considerations.                                  | Matches documented upstream layout limitation, not an omitted SVG animation surface.                                                |
| Resize suppression                     | Projection source       | Existing horizontal-resize suppression retained in projection engine.                                                                                                                                 | Existing layout/observer regressions; source reviewed.                                                                                | Layout troubleshooting.                                         | No dedicated horizontal-window-resize assertion added in this worker scope.                                                         |
| External transformed ancestors         | Astra B                 | Affine correction handles unregistered ancestors and independent transforms.                                                                                                                          | B negative scale, rotation, skew, nonuniform scale, origins, reparenting, late registration and interruptions.                        | Layout troubleshooting.                                         | Existing stronger support preserved; keep original geometry tolerances in final run.                                                |
| Sticky/scroll/clipping boundaries      | Astra B                 | Actual sticky displacement including sticky end constraints and nested clips.                                                                                                                         | B registered/unregistered, transformed host, nested scrolling, overflow:clip, pin entry/exit and reversal; RD active scroll separate. | Layout advanced and Reorder scrolling.                          | Existing regression preserved. Combined new Reorder+sticky nesting requires review evidence before claiming that exact composition. |
| Curved ordinary/shared layouts         | L/A/source              | Public arc helper; transition.layout.path survives mount/update/destination selection; authored rotation adds and settles at endpoints.                                                               | ARC 3 pure + 2 browser cases.                                                                                                         | `/docs/layout#curved-layout`, `ParityLayoutArc.svelte`.         | Verified focused; documented quadratic interpretation differs from A shorthand.                                                     |

## Reorder matrix

Implementation is `ReorderGroup.svelte`, `ReorderItem.svelte` and
`reorder-context.ts`. The exported namespace is `Reorder.Group`/`Reorder.Item`.
This is actual drag ordering; old array-rearrangement layout demos are not used
as its parity evidence.

| Feature, option or observable behavior | Upstream          | Current Svelte API/implementation                                                                                                                                                                       | Tests                                                                                                  | Documentation/example                                 | Status and precise remaining difference                                                                                                                           |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Controlled values and identity         | R/SR              | Required generic values/onReorder; strict identity, unique values, keyed each block. Emissions preserve unmeasured slots and suppress duplicate pending orders until the parent accepts a change.       | RP object identity/nonmutation; RD controlled browser reorder.                                         | `/docs/reorder#start`; `ParityGestureReorder.svelte`. | Verified core controlled path; rejected callback/pending-measurement branches source reviewed.                                                                    |
| Tags/native props/ref                  | R/SR              | Group as=ul, Item as=li; native attributes/events, bind:ref and motion props; required item value; descriptive outside-group error.                                                                     | RD custom native tags/handle; GS public client/SSR compile.                                            | Reorder complete Group/Item tables.                   | Verified used tags; strict installed-consumer inference belongs to root package gate.                                                                             |
| Automatic and explicit axis            | SR                | Omitted axis detects x/y/xy from measured intervals; empty→y. Explicit x/y/xy accepted; live wrap changes retain active drag.                                                                           | RP empty/horizontal/vertical/unequal/wrapped; RD live y→xy.                                            | Reorder list then grids.                              | Verified.                                                                                                                                                         |
| Linear collision ordering              | SR                | Adjacent center crossing follows velocity sign; no zero-velocity linear reorder.                                                                                                                        | RP exact centers/direction/zero velocity; RD trusted/controlled order.                                 | Reorder behavior/reference.                           | Verified.                                                                                                                                                         |
| Wrapped/xy ordering and RTL            | SR                | Nearest row/box and horizontal insertion support wrapped rows and grids; RTL applies only to xy.                                                                                                        | RP cross-row/nearest-box/RTL; RD grid.                                                                 | Reorder grid/RTL section.                             | Verified source behavior. Automatic single-axis RTL does not reverse velocity logic; use explicit axis=xy, as documented/tested.                                  |
| Motion composition and stacking        | R/SR              | Same x/y values/projection; item defaults layout=true and snap-to-origin; supplied style MotionValues reused. zIndex=1 while x/y nonzero, unset at origin. Internal ordering precedes caller callbacks. | RD layout/release/removal; source-reviewed external-MV and zIndex branches.                            | Reorder Item props/positioning.                       | Implemented; no second transform renderer.                                                                                                                        |
| Handles/accessibility                  | R/C               | dragListener=false with controls; native button/range alternatives provided; no invented keyboard drag behavior.                                                                                        | RD handles; GD keyboard movement/focus; installed consumer trusted handle focus reported by root.      | Reorder handles and accessibility sections.           | Verified focused, including input intent preservation.                                                                                                            |
| Focus through keyed moves              | Svelte adaptation | Capture focused descendant before DOM move; restore only if native movement blurred to body; deliberate outside/body focus wins. Removal invalidates pending restoration.                               | RD three focus cases.                                                                                  | Reorder lifecycle.                                    | Verified three-browser checkpoint.                                                                                                                                |
| Automatic edge scrolling               | R/SR              | Nearest scrolling element, including the group, or document; clipping-aware 50px edge region, source 25px/update maximum. Owner-local state; no extra public knobs.                                     | RD stationary-pointer self-scroll and stop-on-removal; PG ancestor compensation.                       | `/docs/reorder#scrolling`.                            | Verified vertical self-scroll. Horizontal/page/two simultaneous groups are implemented source-reviewed branches, not separately claimed by this focused evidence. |
| Insertion/removal and axes during drag | R/SL              | Register/unregister current layout; adjust origin/current pose; preserve latest pointer position through controlled DOM changes.                                                                        | RD sibling insert/remove, active-item removal, wrapped-axis switch.                                    | Reorder composition/presence links.                   | Verified focused. Retained exit plus nested Activity integration belongs to root composition gate.                                                                |
| Consecutive trusted swaps              | SP/SR             | Primary window pointer tracking survives native capture loss from keyed DOM moves.                                                                                                                      | Root installed consumer asserts two actual swaps; synthetic RD remains a separate geometry regression. | Reorder lifecycle and Drag window tracking.           | Root reports consumer fix passes; integrated qualification recorded in VERIFICATION.md.                                                                           |
| Cleanup and isolation                  | SR                | Per-group scroll state; attachment owns listeners/frames/inertia; unmount/disable/cancel stop work and unregister values.                                                                               | RD active removal/scroll stop; GC pointer work after unmount; G2 callback disposal.                    | Reorder and controls lifecycle.                       | Verified teardown; source has no module-global current Reorder group.                                                                                             |

## Documentation and canonical examples

Seven current pages are provided by `src/lib/site/content/gestures-layout.ts`:
`gestures`, `drag`, `hover`, `use-drag-controls`, `reorder`, `layout`,
`layout-group`. Concept pages teach techniques; helper/component pages carry
complete API tables, lifecycle, SSR, accessibility, troubleshooting and links.
They preserve the site's existing styling and do not expose internal classes in
introductory examples.

Nine runnable components have exactly one primary documentation registration in
`src/lib/site/examples/gestures-layout-examples.ts`: `ParityGestureFeedback`,
`ParityGestureDrag`, `ParityGestureHover`, `ParityGestureControls`,
`ParityGestureReorder`, `ParityLayoutExpand`, `ParityLayoutGroup`,
`ParityLayoutNamespaces` and `ParityLayoutArc`. Raw source is the displayed source,
with only the local import rewritten to `astra-motion`. GS checks client and SSR
compilation of the complete components and six complete inline examples. GD and
ARC exercise the actual interactive components. Larger legacy compositions remain
at dedicated `/examples/[id]` routes with links to primary guide anchors.

The old assertions that advanced constraints, direct layout props and Reorder are
out of scope have been removed from current content. Root owns the matching
README, status, about, migration, scope and release-note updates. Website E2E
route/alias/source evidence is recorded separately in `SITE-RESULTS.md`.

## Corrections found during implementation/review

- Preserved explicit crossfade=false across partial configuration merges.
- Preserved direct layoutDependency reference identity and required drag
  measurement even when that dependency stays unchanged.
- Kept drag-only measurement from becoming animated layout after config updates.
- Checked before-measure order against actual measurements, permitting upstream's
  extra before callbacks for unchanged nodes in a root transaction.
- Transferred resize observation when a constraint getter resolves a new element.
- Preserved authored incoming shared transition/path/duration separately from
  projection-mutated visual props.
- Preserved focus through keyed Reorder moves without stealing explicit focus.
- Awaited documented postRender gesture callbacks in old real-pointer assertions.
- Compared stationary-pointer displacement with the browser's actual fractional
  scrollTop instead of widening the original exact-delta assertion.
- Fixed native external-handle focus transfer being mistaken for window blur.
- Removed primary explicit capture/capture-loss cancellation after an installed,
  trusted-pointer Reorder test proved it stopped at the first keyed move.
- Resolved a reactive viewport-root getter inside the tracked core effect;
  resolving only during queued refresh missed its Svelte state dependencies.
- Qualified SVG drag against delivered trusted pointer coordinates and screen CTM,
  not an assumed integer box midpoint. Automation supplies fractional positions;
  the exact transform assertions retain five-decimal precision.

## Verification checkpoints and remaining release gates

1. **Prior owned runtime checkpoint:** Chromium and Firefox each passed 61/61
   cases. After the explicit-body-focus addition, the affected Reorder/docs files
   passed 16/16 on each; final style policy passed the 10-case primary suite.
   WebKit passed the full resulting **62/62**: G1 16, G2 9, PG 9, PD 10, RD 8,
   GD 8, ARC browser 2. This predates the final root focus/capture/viewport fixes.
2. **Server subset:** **25/25** passed: GP 5, RP 6, ARC pure 3 and GS 11.
3. **Layout correction checkpoint:** root reported the advanced layout/managed
   presence set passing 9/9 after the dependency/crossfade/anchor corrections;
   later presence/activity additions have their own root verification record.
4. **New six-contract coverage:** GC initially passed 8/10 Chromium cases.
   Root fixed reactive root tracking; SVG expectations were corrected to compare
   actual native coordinates. The two formerly failing cases then passed 2/2.
   The ten cases therefore have focused passing evidence across those runs, not
   a claim of a single final ten-case or cross-browser execution.
   Logs: `/tmp/astra-gesture-contracts-chromium.log` and
   `/tmp/astra-gesture-contracts-corrected.log`.
5. **Final source fixes:** root reports installed trusted handle focus and two
   consecutive Reorder swaps passing after the blur/window-tracking changes.
   Root owns the final packed-consumer artifacts and combined three-browser run.
6. **Delivery still pending:** one integrated browser matrix, packed-package
   strict types/SSR/hydration/production checks, final production website E2E,
   independent adversarial review, polish, merge/push and deployment verification.
   This subsystem matrix does not declare those gates complete.

All existing transformed-ancestor/sticky assertions and tolerances must remain.
The independent reviewer should challenge rows marked source-reviewed, especially
nested group cohort semantics, Reorder horizontal/page scrolling and retained
presence/Activity composition. Those notes identify the evidence boundary rather
than reclassifying unfinished required behavior as optional scope.
