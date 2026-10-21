# Svelte motion ecosystem comparison — 21 October 2026

## Scope and reproducibility

Astra baseline: `6d8a109` (`0.1.0-rc.3`). Source snapshots were cloned without
installing or running competitors. Website pages were fetched separately; their
claims are not execution evidence. This is a code/docs/test audit, not a speed,
accessibility, or reliability benchmark. A listed feature does not establish
behavioral parity for interruption, lifecycle, or geometry edge cases.

| Project                                                                                                    | Source snapshot | Version / engine                                   | Role                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Astra                                                                                                      | `6d8a109`       | RC3; bundled Motion/Motion DOM 13.4.4              | Svelte motion primitives, native bindings, presence, layout, values, Activity/View, text/tilt |
| [Svelte Motion](https://github.com/micha-lmxt/svelte-motion/tree/c734f01e404b091450c1bb8c174ef9a950700e23) | `c734f01`       | 0.12.2; Popmotion 11, framesync 6                  | Earlier Framer-style Svelte adapter, action/slot authoring                                    |
| [Humanspeak](https://github.com/humanspeak/svelte-motion/tree/f2b5d7666cb62767fc4a753391fc35da840f46a2)    | `f2b5d76`       | 2.1.1; Motion/Motion DOM 14.2.0                    | Closest current Svelte 5 animation-library comparison                                         |
| [Motion Core](https://github.com/kaltwrk/motion-core/tree/74ad6e66d50cc9b1849a505fcd1b352704920745)        | `74ad6e6`       | Monorepo; component-specific GSAP/OGL dependencies | Curated components and registry/CLI distribution                                              |

The fetched Humanspeak homepage identifies 2.0.1 while its checked-out manifest
identifies 2.1.1. Its current `motionDomProjection.ts` uses upstream
`HTMLProjectionNode`/`HTMLVisualElement`; `projection.ts` explicitly records
retiring its older custom projection implementation. Do not repeat an old
"they only have home-grown FLIP" assessment. Its current README supports
MotionConfig reduced motion and coordinate transformation; older indexed README
text claiming these are absent is stale. Package manifests and current source
are authoritative for this snapshot.

## What we can learn

### Legacy Svelte Motion

The [layout guide](https://svelte-motion.gradientdescent.de/layout/) teaches with
small, inspectable examples: a CSS justify-content switch, shared identity,
scale correction, and grid reordering. The [introduction](https://svelte-motion.gradientdescent.de/)
also makes the relationship to Framer Motion immediately recognizable.

Take the teaching structure: one state change, one visual consequence, complete
code beside it, followed by a composition example. Astra already has canonical
example source and Fieldwork; simplify entry-level examples before adding more
surface area. Preserve the existing native-binding path for scoped CSS and
Svelte directives instead of forcing every example through wrapper components.

Its layout guide explicitly discusses Svelte update ordering and an `update`
remeasure trigger. This is useful historical explanation of a real integration
problem, not a reason to make Astra users manually trigger ordinary reactive
layout. Astra's observer/transaction and retained-exit regressions remain needed.
Its slot/action API and old build workarounds should not replace Svelte 5
attachments, runes, or our packed-consumer checks.

### Humanspeak Svelte Motion

The [site](https://motion.svelte.page/) presents familiar prop names, a short
install path, categorized demos and links to machine-readable documentation.
Those are adoption advantages: users can identify a migration path quickly.
Astra shares the familiar motion-tag surface but has a local-tarball RC workflow;
publication/install convenience is a distribution gap, not an animation defect.

Priorities to borrow:

1. Generate concise agent-readable API indexes and markdown mirrors from Astra's
   existing docs metadata and canonical snippets, rather than maintaining another
   hand-written API description. Keep version, limitations, and source links in
   that generated output. We did not verify the website's advertised mirror
   generation from its source, so treat delivery as a website claim.
2. Give each common migration scenario one short recipe: enter/exit, responsive
   layout, controlled reorder, shadcn/native element binding, and reduced motion.
   Explicitly explain Astra's `present`/`items`/`value` presence adaptation.
3. Evaluate its Vite tag-import rewriting and `/three`, `/vgpu` effect adapters
   as separate proposals. Astra already offers lazy/mini feature entries; a
   compiler plugin needs measured consumer-bundle savings before being added.
   GPU adapters need lifecycle/SSR qualification and should stay optional.
4. Track Motion 14.2.0 as an upgrade candidate. Do not copy tests that depend on
   new upstream behavior and silently claim parity on our pinned 13.4.4 engine.

Astra's distinctions include native bindings, explicit Svelte presence semantics,
Activity lifecycle ownership, scoped playback settlement, bundled engine identity,
and real-browser/packed-consumer qualification. Current source supports these
contracts; this audit does not establish that every competing implementation
lacks an equivalent feature. Neither "drop-in" nor a feature-count table proves
correctness under cancellation and unmount.

### Motion Core

Its [introduction](https://motion-core.dev/docs/introduction) describes a curated
GSAP/OGL component collection. Compare it to Astra's recipes/examples layer,
not as a replacement for our Motion engine or projection runtime.

Each component has a manifest declaring files and dependencies. For example,
`text-loop/component.json` associates TextLoop with GSAP and its source files;
`split-reveal/component.json` additionally declares the shared GSAP helper.
This is a useful model for recipe-level ownership, explicit dependency cost,
and docs/navigation validation. Its focused text, pointer, card, navigation and
canvas demos communicate outcomes more directly than an API inventory alone.

Borrow the presentation and manifest discipline for optional Astra recipes. Use
our TextReveal/TextSwap/Tilt and existing primitives where they fit. Do not add
GSAP or WebGL to the core bundle merely to imitate a visual effect. A separate
registry/CLI is a later distribution decision, not a prerequisite for improving
copyable examples. Decorative demos still need our reduced-motion, keyboard,
SSR, interruption and cleanup contracts; appearance is not proof of these.

## Test decisions

Competitor tests must be judged by the bug they reject, the environment they
exercise, and their discovery in CI. Static type tests, jsdom mocks, native
browser geometry, and packed-consumer tests answer different questions. More
assertions or a larger test count is not a quality ranking.

Two read-only subagent audits were requested against the pinned snapshots.
Their findings, selected replacements, attribution and verification are recorded
below after review. Competitor suites were not executed, so no competitor pass
rate or cross-library performance claim is made.

### Confirmed removal

Removed the unreferenced `src/lib/vitest-examples` greeting component/helper and
their two starter tests. `git grep` found no consumers outside those four files.
They only proved a greeting string and a demo heading; they guarded no Astra
contract. Keeping teaching scaffolding in `src/lib` also needlessly involved it
in package generation. Existing real component and server tests exercise the
runner, so a replacement runner-smoke test is unnecessary.

### Legacy / Motion Core audit outcome

The read-only audit found no runtime animation tests to port from either snapshot.
Legacy's `tests/types/components.test-d.ts` checks component constructor types;
its test script explicitly selects typechecking. Motion Core's Rust tests cover
registry/cache behavior, path safety, dependency resolution, and file generation.
Those are useful references for a future recipe CLI, not substitutes for native
layout, presence, or animation lifecycle tests. They were inspected, not run.

Motion Core's manifests and `scripts/validate-navigation.ts` offer a useful docs
integrity pattern. Astra already has canonical-snippet and package validation;
reuse those sources before adding another validation framework. CLI security tests
should only be ported if Astra acquires corresponding file/network behavior.

The audit identified a tautological `expect(true).toBe(true)` early return in
`remaining-apis.svelte.spec.ts`. Replaced it with `it.skipIf` on the browser's
View Transition capability. Unsupported browsers now report an actual skip;
supported browsers execute the same rejection/update/cleanup assertions. The
changed spec passed all 16 cases in each of installed Chromium and Firefox;
both current installed engines support the capability, so neither run skipped it.

### Humanspeak audit outcome and adopted coverage

Its current Vitest config uses jsdom; the Playwright config enables Chromium,
with Firefox/WebKit commented out. Astra's configured component/E2E/consumer
matrix is broader. That describes configured coverage, not a claim that this
session executed either project's entire matrix. The audit found useful specific
regressions, not evidence for replacing our suite wholesale.

Adapted six cases with pinned-source references and the complete MIT notice in
[the provenance directory](../../tests/competitor-baseline/README.md):

- **Two hover/tap ownership cases.** Mount public `motion.button`; hold a
  keyboard Space tap owning scale, then enter/leave hover owning opacity. Assert
  the tap is already active through rendered scale before crossing the boundary;
  assert opacity changes while scale stays pressed and both settle correctly on
  release. The reference's fixed hydration/gesture sleeps become state polling.
  Synthetic independent inputs isolate arbitration; existing trusted-input tests
  remain. The fixture uses authored base styles, matching the reference. An early
  Enter version exercised pointer-held hover deferral instead, so Space is
  intentional and not an interchangeable key.
- **Four genuine server-rendering cases.** The reference's SSR-named file mounts
  through Testing Library/jsdom. Our adaptation uses `svelte/server` in Node and
  checks that `document` is absent. Empty/absent initial must not emit animate-only
  opacity, transform, or CSS-variable styles. Authored border radius proves that
  content was rendered. Positive controls cover explicit initial precedence,
  first/last keyframes, zero, and CSS variables with `initial=false`.

These tests reject real wrong behavior: a temporary `initial-render.ts` mutation
that always selected animate failed three of four SSR cases; a temporary
`gesture-session.ts` mutation suppressing hover during tap failed both gesture
cases. Both runs exited 1 through assertion failures, not compilation or launch
errors. The source files were restored byte for byte before final verification.
No runtime source change is retained.

### Recommendations reviewed but not adopted blindly

- Kept the repeated-await builder identity assertion. `animateView` is a
  thenable: two observers could receive different controls if its implementation
  recreated them. Equality is not inherently a tautology here.
- Kept `experiments/unstaged-rendering/*.spec.js`. They are explicitly manual
  research, executed by the documented `node experiments/unstaged-rendering/run.mjs`
  runner. Being outside default test discovery does not make them dead tests.
- Kept SSR/browser pairs, frame-sampling geometry and native lifetime tests.
  Different environments and observable invariants are complementary.
- Did not copy the drag-release-before-frame case as an assumed current contract:
  its reference explicitly names Motion 13.4.5, newer than Astra's pinned engine.
  Add it to an engine-upgrade investigation with the reference's positive control.
- Existing upstream headers/inventories already record Motion provenance; there
  is no reason to erase or duplicate that attribution.

## Recommended next work, in order

1. Improve the adoption path: generate versioned markdown/API indexes from current
   docs and show five concise migration recipes. Evaluate release/distribution
   readiness separately from documentation convenience.
2. Build a small recipe catalog from Astra's existing text/tilt/layout/gesture
   primitives, with explicit metadata, accessibility choices and dependency costs.
   Borrow Motion Core's component manifest discipline without adding its engines
   to our core bundle.
3. Investigate a Motion 14 upgrade separately: pin exact versions, run the existing
   upstream/SSR/browser/packed-consumer gates, and characterize release-before-frame
   drag. Evaluate optional GPU adapters or a Vite rewrite only with measured
   consumer benefit and owner-approved scope.

No comparative performance benchmark, competitor test execution, full release
qualification, new GPU runtime, publication, or dependency upgrade was performed.

## Verification

Working directory for all Astra commands:
`/home/node/.t3/worktrees/astra-motion/t3-af7b8579`.
Evidence logs: `/workspace/research/astra-comparison-20261021/evidence/`.

| Command                                                                                                                                                          | Result                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm run check`                                                                                                                                                 | Exit 0; zero Svelte/TypeScript errors or warnings.                                                                                                                       |
| `pnpm run test:server`                                                                                                                                           | Exit 0; 61 files, 286 tests passed (includes four new SSR cases).                                                                                                        |
| `MOTION_BROWSER=chromium pnpm run test:browsers src/lib/motion-lab/competitor-gesture-ownership.svelte.spec.ts src/lib/motion-lab/remaining-apis.svelte.spec.ts` | Exit 0; 18 passed.                                                                                                                                                       |
| Same two-file command with `MOTION_BROWSER=firefox`                                                                                                              | Initially 16 passed, 2 failed on exact matrix precision; remaining-apis itself passed unchanged.                                                                         |
| `MOTION_BROWSER=chromium pnpm run test:browsers src/lib/motion-lab/competitor-gesture-ownership.svelte.spec.ts`                                                  | Final focused rerun exit 0; both cases passed after the precision refinement.                                                                                            |
| Same final focused command with `MOTION_BROWSER=firefox`                                                                                                         | Exit 0; both passed.                                                                                                                                                     |
| Same two-file command with `MOTION_BROWSER=webkit`                                                                                                               | Exit 1 before test execution: system libraries missing (GTK4, GStreamer, etc.). Not a test pass or a confirmed runtime failure.                                          |
| `pnpm run prepack`                                                                                                                                               | Exit 0; 168 generated elements checked, package built, one pinned engine bundled, strict publint passed. Existing import.meta.env/declaration packaging warnings remain. |
| `pnpm exec eslint src/lib/motion-lab/competitor-gesture-ownership.svelte.spec.ts`                                                                                | Exit 0 on the final precision refinement.                                                                                                                                |
| Svelte MCP autofixer on the two new modules and changed View test                                                                                                | No issues or suggestions; final gesture refinement rechecked.                                                                                                            |
| `git diff --check`                                                                                                                                               | Passed; no retained runtime-source diff.                                                                                                                                 |

Firefox exposes scale 0.9 as `0.8999999761581421`; the final matrix assertion
uses `toBeCloseTo(0.9, 6)`. This tolerance cannot mistake an unpressed scale of 1
for an active tap. Earlier fixture-development failures and negative-control
runs are retained separately from successful final results.

`pnpm run lint` exited 0: full-repository Prettier and ESLint passed.
No full browser/E2E/consumer release matrix was repeated for this test/docs-only
change. WebKit's two changed/new browser specs remain an explicit verification
limit. Competitor suites were not run.
