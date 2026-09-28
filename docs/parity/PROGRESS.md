# Motion parity delivery record

Reference date: 2026-09-27 UTC. Starting commit: b66e376. Integration branch:
`feat/motion-parity`, worktree `/workspace/wt/astra-parity`.

## Delivery phases

1. Repository and official-reference audit; behavior matrix and shared contracts (completed).
2. Runtime implementation in reviewed subsystem increments (integration active).
3. Coherent documentation, canonical examples, public API and packaging.
4. Full verification: server, three browsers, packed consumer, measured bundles.
5. Independent adversarial review, fixes, final polish and affected checks.
6. Merge main, push, CI/Pages verification, deployed interaction checks and cleanup.

Progress is tied to completed phases. No feature is complete based on an export alone.
The requested surface supersedes the exclusions in earlier scope decisions. Historical
research remains historical evidence; it must not be used to omit requested work.

## Worktree ownership

- Root: `/workspace/wt/astra-parity`; shared runtime contracts, SVG/core/config,
  integration, documentation architecture and delivery.
- Values: `/workspace/wt/astra-parity-values`; managed helpers integrated, browser fixes active;
  LazyMotion split design follows this increment.
- Gestures: `/workspace/wt/astra-parity-gestures`; gestures/Reorder integrated, advanced
  layout review and mutation-during-drag coverage active.
- Presence: `/workspace/wt/astra-parity-presence`; Presence/Activity integrated;
  AnimateView and ordinary/SvelteKit transition coordination active.

## Current integration evidence

- Candidate Motion/framer-motion/motion-dom pins 13.4.4. Engine identity/qualified
  source graph check passed before the expanded export surface; rerun required.
- Server suite: 34 files / 150 tests passed. Svelte check: zero errors/warnings.
- Chromium first integrated parity increment: 21 tests passed across SVG, manual
  presence/activity, gestures and Reorder. Value tests exposed a scope attachment
  feedback loop; worker reproduced and is fixing, with full rerun required.
- Direct motion Presence/Activity integration: 5 Chromium tests passed, covering
  descendants, custom exits, reversal, wait replacements, hidden repeated-animation
  suspension, initially hidden reveal and retained input state. Ownership setup is
  untracked so presence state cannot tear down and remount its attachment.
- Activity helper subscribes to a derived active boolean, avoiding cleanup/restart
  on visible-to-exiting transitions that remain active.
- Layout review found partial projection option updates reset crossfade:false;
  preserved options in those paths and corrected measurement-only layout flags.
  Focused advanced regression coverage is pending.

None of this is final parity verification. Full baseline browser matrices, packed
consumer, docs, review, measured bundles and delivery remain open.

## Baseline

Clean main at b66e376. pnpm 11.24.0. Svelte 5.57.0, Kit 2.70.3.
Installed Motion/framer-motion 13.4.3, motion-dom 13.4.2, motion-utils 13.3.0.
Registry latest at audit: Motion/framer-motion/motion-dom 13.4.4, motion-utils 13.3.0.
Dependency changes require source comparison and regression qualification.

Existing CI: check, lint, guide, upstream contracts, server tests, build, bundles,
packed consumer build, Chromium/Firefox/WebKit component and end-to-end matrices.
Packed consumer runtime lifecycle coverage needs confirmation/extension in CI.
Existing runtime generates HTML only. Presence defaults to wait; no requested
AnimatePresence/Activity/View, LayoutGroup, LazyMotion or Reorder public components.

## Environment

Shared Chrome CDP healthy at 127.0.0.1:9222. `rg` unavailable; use find/grep.
All previews must use dev-preview and allocated loopback URLs for browser tests.
Global pnpm store configuration command reported PATH missing its global bin dir;
install nevertheless used /workspace/pnpm-store/v11 successfully.

## 2026-09-28 integration update

Audit/shared-contract phase is recorded in MATRIX.md; implementation remains open.
Managed Values: 16 Chromium cases passed. Gesture corrections: 34 Chromium checks
passed without removing final assertions or widening tolerances. Advanced layout
and managed presence: 9 focused cases passed. Existing boundary/layout review:
21 cases passed. Integrated View/custom/managed presence: **45 tests across all
three browser engines passed**. Root check: zero errors/warnings.

WebKit host packages require unavailable root credentials. Existing cached host
libraries at /tmp/astra-motion-browser-deps/root work with the existing temporary
wrapper runner; its finally block restores the browser files. The full three-engine
suite and server suite are now running. These results remain provisional until
the final integrated revision is checked.

## Documentation and integration update — 28 September 2026

[##--------] 20% Shared contracts established; implementation and documentation integration active.

-34 requested pages,44 canonical runnable examples, dedicated example routes and historical
URL/anchor compatibility. Exact example source and complete inline snippets pass public-source
strict checking.32 focused server documentation tests pass; six new core demo interactions
pass Chromium after reproducing and fixing live reduced policy on unchanged targets.

- Managed helpers18/18 and lazy10/10 each in Chromium/Firefox/WebKit. Gesture/layout focused
  WebKit62/62 and affected final Chromium/Firefox sets pass. Final combined matrix still required.
- Manual shared-Chrome Activity example: exact input/DOM retained across hidden/reveal,
  zero console errors, document200, desktop screenshot `/tmp/astra-activity-docs-desktop.png`.
- Live policy now completes only current positional playback and preserves paint control identity.
  Style ownership regression freezes existing playback for sample equality, verifies the same
  controls across a running ordinary-style write, then resumes to both unchanged destinations.
  This avoids comparing a native compositor clock that can advance during synchronous JavaScript.
- Packed consumer and graph qualification active; initial measurements are provisional. Source
  type audit found ambiguous HTML/SVG union complexity, now factored and awaiting packed recheck.
- Composition worker correcting path lifecycle, hidden external controls and custom child
  MotionValue replacement with dedicated regressions. No full parity claim or delivery yet.

## Candidate integration checkpoint — 28 September 2026

[####------] 40% Runtime and documentation workstreams integrated; qualification corrections active.

The user requested less testing after repeated intermediate checks. Workers now use only
minimal decisive regressions for specific defects; root owns one final combined verification
pass. Intermediate successful evidence is retained rather than rerun without a change.

All main runtime/docs increments are integrated, including factory types, retained Activity
controls, path ownership, custom child subscriptions and six additional gesture contracts.
The production site builds and the managed preview now serves that stable build on4097.
Package/CI tooling now includes independent plain Svelte and SvelteKit consumers. The plain
fixture is checked by its own strict installed-package configuration, just like the existing
Kit fixture, and is excluded from the application's source-only tsconfig.

Installed trusted interactions reproduced two defects that synthetic pointer events missed:
external-handle focus transfer was mistaken for window blur; keyed reorder movement lost
explicit capture and stopped the drag after one swap. Both are fixed; trusted installed
handle and two-swap order assertions now pass. Legacy capture semantics remain preserved.

The latest deferred initial:false target defect is fixed with one passing Chromium regression;
final packed qualification still must run. Viewport getter-root replacement is now tracked by
the component effect. Three nonce propagation/cleanup cases pass Chromium. Sequence arcs,
final package graph/size measurement, independent review/polish, final combined checks and
merge/deployment remain open. No full-parity or delivery claim is made at this checkpoint.

## Final qualification checkpoint — 28 September 2026

[######----] 60% Runtime, documentation, independent review and polish complete; release qualification active.

Frozen runtime: `8ea3543979870e0ede58797875b30b468e1fba06`. The fresh reviewer
resolved five findings and subsequently accepted the hidden playback-clock correction.
The final polish pass changed prose only and recommended retaining the current runtime
boundaries. See ADVERSARIAL-REVIEW.md and POLISH-RESULTS.md.

The combined source matrix ran 1,563 cases across Chromium, Firefox and WebKit:
1,562 passed; the sole WebKit failure exposed a real hidden JS clock update. The
correction commits the held pose synchronously and releases its frame driver without
making playback terminal. All 18 affected Activity checks pass across the three engines,
with the exact freeze assertion preserved and a no-hidden-update assertion added.
No second broad source matrix was started. Server checks pass 203 cases in 44 files;
canonical guide compilation passes with zero errors/warnings; tooling checks pass4/4.
The upstream gate qualifies71 Motion DOM and7 Motion runtime symbols at the pinned version.

Both installed consumers passed strict declarations and builds; the first final archive
passed all7 plain fixtures and14 Kit cases in Chromium and Firefox. The subsequent real
pause correction requires one corrected archive, refreshed sizes, affected Chromium/Firefox
Activity checks and the previously unrun complete WebKit consumers. Those are in progress.
Public package imports stay independent of repository aliases; mini/lazy isolation graphs pass.

To honor the user's request to test less, the complete production-site three-engine
matrix will run in CI. Local production qualification uses the33 documentation-focused
Chromium cases and manual shared-Chrome interactions. Only failing or affected local checks
are repeated. Merge/push, remote CI/Pages, deployed verification and cleanup remain open.

## Local gates closed; remote delivery next

[########--] 80% Local qualification complete; merge and remote verification next.

Corrected runtime8ea3543 has passing strict source, guide compilation, server tests,
all affected lint checks, installed plain/Kit builds, corrected WebKit7+14 cases and
corrected Chromium/Firefox composition cases. Prior complete Chromium/Firefox7+14
results retain their original archive provenance. Final bundle bytes are published
in the guide and packed-bundle-results.json. Production documentation qualifies33
Chromium cases, all34 pages and45 destinations. The catalogue selector correction
keeps the original assertion and selects the frame's source disclosure explicitly.
Manual production Activity retains exact input/DOM state; native View works with no
console errors. VERIFICATION.md is the authoritative consolidated local record.

The remaining delivery actions are merging/pushing this candidate, confirming the
complete default CI matrices and Pages workflow on that exact main revision,
checking deployed interactions and cleaning owned worktrees/browser resources.
Workflow run records and the final delivery report record those remote outcomes.
