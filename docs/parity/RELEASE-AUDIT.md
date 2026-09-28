# Independent release audit of ef77bf8

Date: **2026-09-28 UTC**. Reviewed release:
`ef77bf8d2036f5aac21b7b3cf156f7a39be46b99`. The review treated the existing
matrices, documentation, previous findings and successful CI as claims to test.
No dependency versions, public exports, test tolerances or qualification matrices
were changed. This report supersedes the earlier review's assertion that there
were no substantiated defects in that release.

## Contract and inspection

The baseline remains Motion/framer-motion/motion-dom **13.4.4**, motion-utils
**13.3.0**, upstream commit `636e725fc71315ca91ff196eb09685017e2fe0c8`, Svelte
**5.57.0** and Kit **2.70.3**. The installed ESM implementations and declarations,
including `attachFollow`, `FollowAnimation`, `MotionValue`, sequence construction,
reduced-motion handling and the private `JSAnimation.stopDriver`, were inspected.
The [independent capture manifest](release-audit-references.json) records fresh
retrieval of all 35 official articles. Its article-text normalization differs from
[the original capture](references.json); unequal hashes alone are not evidence of
an upstream contract change. Current prose does not silently replace pinned source.

Inspection covered motion element prop/style/SVG replacement, animation ownership,
variants and sequences, config inheritance, lazy loading/replacement, scroll and
value subscriptions, gesture coordinates and drag sessions, Reorder, layout
boundaries, Presence/Activity and View coordination/resources/navigation. The
existing option audits remain the detailed inventory. This is a bounded source
and regression audit, not proof of every possible cross-feature composition.

The five earlier findings were rechecked in their implementation and affected
regressions. In particular, paused JSAnimation samples and driver release match
the pinned private contract; shared arc clocks and overlapping endpoints retain
their existing assertions. A suspected sequence `transition.default` discrepancy
was rejected after checking upstream sequence handling. No speculative runtime
change was made for it.

## Reproduced defects and resolutions

All four findings are **P2**: user-visible incorrect behavior in supported
compositions, without a security or data-loss claim. Exact assertions failed on
the baseline implementation before the corresponding corrections.

| Finding                                                                    | Concrete trigger and baseline failure                                                                                                                                                                         | Expected contract and correction                                                                                                                                                                                                                                                                                                                                                                                                                                               | Regression evidence                                                                                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scalar spring loses its target and restarts while hidden                   | `useSpring(0).set(100)`, then change spring options or hide/reveal Activity: playback heads back to 0. Calling `.set(200)` while hidden can restart the detached follower's clock.                            | The [spring reference](https://motion.dev/docs/react-use-spring) supports manual targets. Retain the last target separately from the current sample; unchanged scalar input is an initializer, a changed reactive scalar is a new target. Hidden sets retain intent; reveal reconnects the spring. `.jump()` stays immediate and `.stop()` cancels retained intent. Only the owned returned value's methods are wrapped; borrowed sources and engine prototypes are untouched. | Exact numeric and unit-string endpoints, option replacement, held hidden samples/no animation, changed reactive input, jump/stop, plus the installed consumer's hidden set/reveal. |
| Explicit per-run reduced-motion opt-out is ignored on a live policy change | Pause `useAnimate(..., {reduceMotion:false})` at x=20, then set MotionConfig policy to always: baseline jumps to x=100 and finishes.                                                                          | Engine per-call options override defaults. Remember each run's explicit opt-out when observing live policy. Ordinary, sequence, arc and arc-sequence playback preserve their paused pose/state.                                                                                                                                                                                                                                                                                | Four exact pose/state cases; existing default-policy settlement tests retained.                                                                                                    |
| A reduced-motion consumer completes someone else's animation               | Bind an externally animated MotionValue as style x, then change one consumer's policy to always: baseline calls complete on the external animation.                                                           | Playback ownership follows the animation instance, as required for Activity too. Finish only positional playback owned by that visual. An external owner decides its own reduced-motion policy.                                                                                                                                                                                                                                                                                | External playback remains running and advances below its endpoint; the consumer's own sibling y still settles to 100.                                                              |
| Delayed skipped View callback removes a replacement capture's name         | Replace a pending native View capture, then let the browser invoke its old update callback after the new capture installed the same generated name. Baseline restores the authored name over the replacement. | Cleanup must be idempotent and scoped to its capture. Release each generated-name lease once; preserve authored value/priority and replacement ownership.                                                                                                                                                                                                                                                                                                                      | Direct lease regression plus a controlled native callback ordering: both state mutations execute once, replacement name survives, final authored name/reset styles restore.        |

The nine new cases live in
[release-audit.svelte.spec.ts](../../src/lib/motion-lab/release-audit.svelte.spec.ts).
The canonical spring example now exercises a manually set scalar spring and live
spring options. Public source/installed type checks include numeric/unit-string
methods, rejection of wrong value types and per-call/sequence opt-out options.
The View policy, spring lifecycle and useAnimate documentation describe the fixes.

## Local qualification

| Gate                                  | Exact result                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Baseline red regressions              | Three initial cases failed (View lease, spring reveal, policy opt-out); the borrowed-playback case separately failed with finished instead of running.                                     |
| Affected source browser checks        | **70/70 Chromium**, **70/70 Firefox**, across release-audit, parity-values, parity-values-docs, parity-view, parity-borrowed-activity and parity-composition. Includes all nine new cases. |
| Local WebKit                          | Could not launch because this container lacks required GTK/GStreamer libraries. No cases ran and no local WebKit pass is claimed. The unchanged CI matrix installs these dependencies.     |
| Source and full guide compilation     | Both **0 errors, 0 warnings** after correcting two regression/type-narrowing diagnostics.                                                                                                  |
| Formatting, lint and Svelte autofixer | Whole-tree checks pass; all changed Svelte modules/components have no autofixer issues or suggestions.                                                                                     |
| SSR/model tests                       | **203/203**, 44 files.                                                                                                                                                                     |
| Qualification tooling                 | **4/4**.                                                                                                                                                                                   |
| Engine boundary audit                 | **71 Motion DOM + 7 Motion runtime symbols**; pinned contracts preserved.                                                                                                                  |

The first spring regression initially polled the default physical spring for only
the generic assertion timeout. It now awaits the engine's completion promise and
asserts the exact endpoint. No timing tolerance, endpoint assertion, default CI
command or browser scope was weakened. Only affected browser files were run
locally; complete matrices remain release gates in CI.

## Production and installed qualification

Runtime/test/documentation commit: `62e114c16a0c434446fbe05eb7560e0f7032a6ec`,
clean when packed. Archive SHA-256:
`9225b024814a9633defb12bb0eec9dc4021b5b710f6fd38c1d26aba7c607fdb0`.
[Durable package evidence](release-audit-package.json) preserves the two consumer
results, exact archive/source identity, tool versions, byte counts and asset hashes.

- Production site build, 168 generated elements, package generation and strict
  publint pass. Packaging reports pre-existing declarations it cannot emit for
  unpublished lab/site files and a Vite environment warning; strict installed
  public declarations and both independent consumer builds pass with zero errors
  and warnings. No diagnostic was suppressed.
- Source bundle graph checks pass. The independently installed plain Svelte app
  contains no React, Kit dependency or duplicate Motion engine. All lazy/basic/mini
  graph assertions pass, with one shared MotionValue/scheduler identity.
- Complete local Chromium installed consumers: **7/7 plain fixtures**, **14/14 Kit
  cases**, including no-JavaScript SSR, hydration, navigation and cleanup. The
  plain Activity fixture additionally sets a scalar spring while hidden, asserts
  no animation/exact held value, then checks the exact target after reveal.
- Shared headed Chrome 152 production preview: trusted range input reaches 90px,
  changing spring settings preserves that target and rendered matrix x=90; no
  horizontal overflow, console warnings/errors or failed requests (50/50 HTTP
  200). Screenshot captured and inspected; existing design preserved.

Measured independent application initial minified / gzip / Brotli bytes (Svelte
and bootstrap included, not library-only sizes):

| Fixture   | Minified |  gzip | Brotli | Deferred minified / gzip / Brotli |
| --------- | -------: | ----: | -----: | --------------------------------- |
| Eager     |   200751 | 67948 |  60487 | 0 / 0 / 0                         |
| LazyBasic |    71826 | 26462 |  23928 | 83742 / 28926 / 26333             |
| LazyFull  |    71937 | 26515 |  23992 | 140946 / 46435 / 41231            |
| LazySync  |   147628 | 51899 |  46689 | 0 / 0 / 0                         |
| Hybrid    |    96316 | 34736 |  31587 | 0 / 0 / 0                         |
| Mini      |    42330 | 16227 |  14740 | 0 / 0 / 0                         |

The earlier baseline's CI and Pages API records were independently confirmed to
have succeeded for ef77bf8. That did not prevent the four reproduced defects.
The delivering revision must pass all ten unchanged CI jobs (general checks,
three complete source-browser suites, three production E2E suites and three
complete packed-consumer suites) and Pages build/deploy. Exact revision/run links
and deployed interaction observations belong to the final delivery response;
this local record does not predeclare remote success.

Prior archive measurements in [package results](PACKAGE-RESULTS.md) remain
historical evidence, not byte measurements of this corrected runtime.

## Remaining qualification boundaries

- Activity retains state/DOM and suspends Astra-owned work. Ordinary Svelte effects
  remain active unless written with `useActivityEffect`. Private Motion+ alpha
  source remains unavailable; this is the approved adaptation, not React lifecycle
  equivalence.
- Presence identity/snippets, reactive getter inputs, explicit View transactions
  and root attachments, and the separate Kit navigation entry remain explicit
  renderer/framework adaptations.
- Layout/drag evidence covers 2D affine, sticky, nested scroll and clip boundaries.
  Perspective/3D projection is not qualified. Reorder remains a one-dimensional
  list facility, not a general grid/RTL drag-and-drop system.
- Pinned engine discrepancies documented in [shared contracts](CONTRACTS.md)
  remain visible. The private pause compatibility boundary requires requalification
  on engine upgrades. Shared upstream scroll scheduling may remain alive for other
  owners when one consumer hides; the hidden consumer's subscription is suspended.

The requested surface is implemented with these boundaries. The baseline's blanket
completion wording was too strong: the new regressions demonstrate that prior
passing suites missed real compositions. Qualification means the specified
contracts and tested cases pass, not that further adversarial defects are impossible.

## Follow-up from the complete delivery matrix

The first delivery candidate `10757734fd2dc9eacef30a58e8b07f4625826371`
passed nine CI jobs, including all **1,590 component-browser cases** and all
three complete packed consumers. Its archive was byte-identical to the local
archive above. Pages deployed and the live Spring, Activity, View, Reorder and
homepage checks passed. Nevertheless, [WebKit production E2E](https://github.com/alois-reinstadler/astra-motion/actions/runs/36387080386)
found an additional **P2 aspect distortion** during interrupted editing-desk
resizes: `pixelError=1.473968505859375` exceeded the unchanged **1.25px** bound.
Chromium E2E passed 70, Firefox passed 69 with the existing Chromium-only touch
emulation skip, and WebKit passed 68 with that same skip and one actual failure.
This candidate is not reported as a successful release gate.

Pinned `create-projection-node.mjs:measure` rounds both logical box edges in
WebKit. Transform inversion can place nearly integral extents across a rounding
boundary: the new deterministic regression measures **201** instead of
**200.00002**. The correction retains the exact measured extent specifically for
`preserve-aspect`, preserving Motion's rounded origin and all other modes. It
reuses the existing scroll/transform inversion and leaves engine prototypes and
dependencies unchanged. This explicitly corrects pinned upstream behavior rather
than claiming identical implementation. The new compatibility contract is in
`tests/upstream-motion/reviewed-exports.json`.

Local WebKit was made usable with existing extracted system libraries and an
isolated copy of its launcher that retains LD_LIBRARY_PATH, plus Mesa's extracted
EGL vendor manifest. The host-library catalogue preflight was bypassed for those
local commands because it cannot detect the supplied GLES library; browser
launch, rendering and all test assertions still run. No system packages or shared
browser files were changed. CI continues installing/validating its own dependencies.
The deterministic regression failed before the fix and passes afterward; an
unmodified local run of the 80-frame desk test happened to pass, demonstrating why
that timing-sensitive run alone would not disprove the CI failure.

Revised local qualification: **81/81** affected layout cases across all three
engines. The unchanged 80-frame production resize test passes **9/9** (three runs
per engine); WebKit maximum pixel errors are **0.03973388671875**, **0.02557373046875**
and **0.031646728515625** against the original 1.25px bound. Source and guide checks
again report zero errors/warnings; lint, 203 server cases, four tooling cases,
engine/export checks, build, publint and source bundle checks pass for this revised
candidate. Shared Chrome production preview preserves the 3:2 image (300x200)
after format/inspector changes, without console/network errors or overflow;
screenshot inspected. No showcase CSS, markup, existing E2E assertion or workflow
was changed to obtain these results.

The revised archive is built cleanly from
`73f5225a458bcf5c7f7957c07510ee877c369954`, SHA-256
`ca61409d25ccbcf102999187b4b14e4c12a631f78eb6fa4e0ed14d92e8b9a1bb`.
[Final local installed-package evidence](release-audit-final-package.json) records
**7/7 plain fixtures and 14/14 Kit cases** in Chromium, strict declarations/builds,
and all bundle-isolation checks. Only `layout.js`, `projection-boundaries.js` and
their corresponding declarations differ from the initial audit archive; no files
were added or removed. The earlier four runtime fixes are byte-identical. The
complete unchanged remote matrices qualify the subsequent evidence-only delivery
commit; their exact links and deployed checks are reported in the delivery response.
