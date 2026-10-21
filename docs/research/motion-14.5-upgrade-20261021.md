# Motion 14.5 upgrade

Date: 2026-10-21. Requested outcome: update Astra to the latest stable Motion engine.
Registry `latest` queries resolved Motion, Motion DOM and Framer Motion to **14.5.0**;
their exact Motion Utils dependency is **14.1.1**. These versions are pinned together
in the package manifest and lockfile. The exact new Motion versions are recorded in
the existing release-age exception list; no global age policy is disabled.

The earlier [catch-up report](humanspeak-catchup-20261021.md) records historical
13.4.4 qualification and a 14.2.0 trial. It is not evidence for this upgrade.

## Compatibility changes

- Motion 14.5 removes `getBaseTarget`. Masked transform initialization now preserves
  the latest value or the public props-backed base value, resolves borrowed values,
  falls back to the engine identity, and registers the base through `setBaseTarget`.
  The regression checks the original scale, animation completion, temporary priority
  and restoration of the initial scale; it no longer calls the removed engine method.
- Paths now prefer `animateValues`. Astra wraps that hook, preserving the original
  engine clock on both positional values, interruption ownership, Activity suspension
  and reduced-motion handling. The deprecated `animateVisualElement` hook remains a
  fallback for legacy custom paths. Sequence samplers use the same public value hook.
- The hybrid engine now honors paths directly. Reduced-motion fallback removes the
  path before handing targets to the engine, so curved positional playback cannot
  bypass the ordinary instant transform policy. Explicit `reduceMotion: false` remains
  supported.
- Upstream characterization now expects scroll listeners to be released and resolved
  playback inspection to leave unrelated measurements pending. The measurement test
  explicitly flushes afterward as a positive control. The finished native cancellation
  defect still reproduces, so Astra's ownership/handoff protection remains necessary.
- Native scroll attachment now applies ranges through the engine's `onAttach`
  callback and replays after setting the range. The previous direct range fields
  were ignored by the new timeline attachment API. All 40 Chromium scroll tests
  passed after this change.
- The new compositor prematurely commits delayed instant transform endpoints.
  Astra adds a public per-value update observer only to these delayed instant
  channels, keeping them on Motion's JS driver. Existing callbacks and target
  reduction/skip flags are preserved; ordinary transform tweens remain accelerated.
  Regression coverage includes nested delays and target-policy precedence.
- Tests now control the actual animation playback instead of assuming a global JS
  clock also advances compositor transforms. Delay tests retain exact origin,
  midpoint and endpoint assertions. Intro interruption tests freeze the replacement
  at its origin to distinguish discontinuity from legitimate elapsed motion.
  Spring completion waits for both the rendered position and the live MotionValue.
  Independent Activity cohort groups are allowed one render frame to finish apart,
  while requiring progress at the control's endpoint and an exact endpoint afterward.
- Runtime shape checks now cover the current path hooks and base-target methods as
  well as the private handles still used by Activity and cancellation. Historical
  qualification stays separate in the reviewed metadata.

No regression was skipped or deleted, no Motion dependency was patched, and no second
animation engine or direct React dependency was introduced. Public Astra entry points
and ownership contracts remain the same.

## Verification

Working directory: `/home/node/.t3/worktrees/astra-motion/t3-af7b8579`.
Evidence directory: `/workspace/research/astra-motion-latest-20261021/`.
The final check results and archive provenance are recorded here after qualification.

The following checks passed:

- `pnpm check`: zero errors and warnings after fixing the transform-playback
  narrowing in the delay test.
- `pnpm run check:guide`: zero errors and warnings.
- `pnpm run lint`: complete Prettier/ESLint gate; changed-file lint covers subsequent
  test-oracle edits.
- `pnpm run test:server`: 300 tests; `node --test scripts/*.test.mjs`: eight tests.
- `node scripts/check-motion-upgrade.mjs`: 81 Motion DOM runtime imports, seven Motion
  imports, 152 type imports, 465 source files, shared engine identities and exact pins.
- `pnpm run build`: production site, package generation and strict publint passed.
  Packaging retains its existing warnings about a non-distributed composition type
  fixture and Vite environment use; strict installed declarations passed independently.
- `node scripts/check-site-bundles.mjs` and `node scripts/measure-motion-bundles.mjs`:
  route budgets passed; the full fixture has no React runtime.
- `node scripts/prepare-motion-consumer.mjs --output=<evidence>/consumer-qualified.json`:
  fresh plain Svelte and SvelteKit consumers, strict declarations and independent
  production builds passed.
- `MOTION_BROWSER=<browser> node scripts/qualify-packed-motion-ci.mjs
<evidence>/consumer-qualified.json <evidence>/packed-runtime`: passed on Chromium,
  Firefox and WebKit, all nine fixtures on each engine, using the same archive.
- Upstream browser contracts: eight Chromium/Firefox checks and four WebKit checks
  passed, including current path/base shapes, measurement isolation, scroll cleanup
  and native cancellation characterization.

The packed archive is
`/tmp/astra-motion-production-xM1KYd/astra-motion-0.1.0-rc.3.tgz`, SHA-256
`8cd54f53fc857e51c94ce2251745c29987ea5b8dbf52ea476b273985aba02c5c`.
Its provenance correctly records `c2bd713` plus the uncommitted upgrade diff; it is a
local qualification artifact, not a published release archive from the final commit.

The complete Chromium component run passed 1,225 of 1,226 cases; its sole failure
was the running-clock continuity assertion in scoped timeline replacement. That
case now tests running cancellation separately from held-pose continuity, retains
its original two-pixel rendering budget, and explicitly checks replaced settlement
and rejection of obsolete playback. Its complete 15-test file passes afterward.

The final Firefox timing-contract rerun passed all 63 tests across scoped timelines,
paused playback and intro retargeting. Native pause readiness is awaited explicitly;
seek is applied after pause so elapsed running time cannot change the intended
midpoint. Live MotionValue completion is followed by a rendered endpoint assertion.

The production sweep exposed stale baseline expectations introduced by the earlier
recipe work: zero versus five migration examples, and 41 versus 42 catalog entries.
These now require the complete current inventory. Chromium's other 82 cases passed,
and all three corrected cases passed in a follow-up that visits every guide and
catalog destination. Firefox's other 83 cases passed, with one native-feature skip.
The corrected Firefox documentation case passed on rerun. WebKit passed 83 cases
with one native-capability skip; its remaining queue glyph case exceeded the 30-second
budget under load, then passed unchanged in 7.6 seconds on a focused rerun. Together,
these production runs and rechecks cover 253 passing cases and two capability skips.

Full Firefox passed 1,223 of 1,226 cases before the three timing-oracle repairs;
all 63 tests in those three files passed afterward. The parallel WebKit run passed
1,217 of 1,227 cases. Its failures included insufficient natural-frame samples,
expired fixed deadlines, a native fade that had already completed, the old intro
endpoint assertion, and drag/resize timing boundaries. A focused rerun of all nine
failed files plus the new ownership, path, delay and timeline contracts passed
**151 of 151 tests**, with the drag, resize and natural-paint assertions unchanged.
The failed broad-run logs are preserved; that focused pass is not represented as a
successful full run. The final stable full run then passed **all 1,227 tests across 144 files** in
566.20 seconds:

```sh
MOTION_BROWSER=webkit /workspace/research/astra-motion-latest-20261021/run-webkit.sh pnpm run test:browsers
```

Its evidence is `matrix-stable-webkit.log`. No source, test or assertion was changed
during this final run. The earlier parallel run's failures remain in
`matrix-final-webkit.log`; they are not rewritten or silently counted as passing.

The subsequent changed-file ESLint check also passed. The final complete bundle
measurement is tracked in `docs/research/bundle-sizes.json`: full fixture 457,086
minified bytes, 109,589 gzip, 89,457 Brotli, no React. These are fixture measurements,
not installed-library-only sizes, and the previous checked-in snapshot was older
than the immediately preceding commit, so it is not a controlled upgrade comparison.

## Local WebKit runtime

The container lacks WebKit's GTK/GStreamer runtime. Packages were downloaded and
extracted without system installation under the earlier catch-up evidence directory.
An owned launcher under `browser-runtime/browsers` preserves that local library path;
it does not modify the installed Playwright browser. The software Mesa vendor is
selected explicitly for the headless EGL display.

`run-webkit.sh` in the evidence directory supplies that environment. Its
`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` disables only the ldconfig-based
preflight, which cannot see the extracted libraries. The real WebKit executable,
page loading, assertions and browser errors still run normally. CI can use the
existing Playwright `install --with-deps` workflow instead. No runtime environment
settings or dependencies are added to consumer applications.

## Remaining upstream limitations

Motion 14.5 can lose a same-turn paused seek while a newly created layout transform
switches from its initial compositor group to the JS driver. The layout/state
coexistence regression initializes the group before seeking and requires the exact
0.91 scale, then retains its projection and interruption assertions. This does not
qualify immediate direct-engine paused seeking. No dependency patch hides the edge.

Firefox can also report a pending native animation's rebased playback time below
zero immediately after pause. Scoped-pause coverage therefore asserts the actual
pose and clock remain held, followed by an explicit seek to the exact midpoint.
The upgrade does not claim an identity between that pending time and rendered pose.
