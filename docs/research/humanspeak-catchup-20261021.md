# Humanspeak catch-up: implementation and engine decision

Date: 2026-10-21. Comparison source: Humanspeak Svelte Motion 2.1.1,
commit `f2b5d7666cb62767fc4a753391fc35da840f46a2`.
Reference: https://github.com/humanspeak/svelte-motion

## Delivered

- `/llms.txt`, `/llms-full.txt`, `/docs/<slug>.md`, and
  `/reference/0.1.0-rc.3/{llms.txt,llms-full.txt,api.json,recipes.json,docs/<slug>.md}`.
  These are prerendered from canonical documentation and registered examples.
  The API index includes package entry points, root runtime exports and exact engine pins.
  Unknown versions return 404; only the current release is emitted. Historical snapshots
  must be retained explicitly when the release version changes.
- Five migration recipes in the existing React migration guide: presence, responsive
  layout, controlled reorder, native elements and motion policy. Sources and previews
  reuse the canonical examples.
- `/recipes` and `/recipes.json`: six compositions with complete source files,
  dependency specifiers/versions, accessibility and reduced-motion instructions.
  Cost descriptions identify entry points and dependencies; they are not byte measurements.
- `useCycle`: reactive object API, static items or a live list getter, explicit index
  validation, wrapping, clamped reads and clear empty-list errors.
- `toMotionValue`: readable-store and rune-getter bridge with explicit caller ownership;
  borrowed MotionValues pass through unchanged. Getter tracking is Svelte reactivity,
  not MotionValue dependency tracking. SSR getter reads produce a snapshot.
- Root exports for the existing engine's `attrEffect`, `propEffect`, `styleEffect`,
  `svgEffect`, and `createEffect`. No second engine or framework adapter was added.

These helpers close concrete API gaps identified by the delegated audit. They do not
establish drop-in compatibility with every Humanspeak API, lifecycle policy or signature.
GPU/Three and a new Vite integration remain separate adoption decisions; they are not
required for the core Svelte interactions above.

## Historical Motion 14 trial: retain 13.4.4

Tested exact `motion`, `motion-dom`, `framer-motion` 14.2.0 and
`motion-utils` 14.1.1, matching the inspected Humanspeak dependency baseline.
All imported export names existed and the package identity gate passed. That was
insufficient evidence of compatibility:

1. `pnpm run check` failed because `VisualElement.getClosestVariantNode` and
   `VisualElement.addVariantChild` were removed. Astra's late parent adoption calls
   them in `src/lib/motion/visual.ts`. Motion 14 inlines ancestry traversal during mount;
   the follow-up below preserves inheritance boundaries and adoption/unmount cleanup.
2. A focused Chromium run passed 49 tests and failed the existing transform ownership
   case `retains raw-transform precedence until it is explicitly cleared` by timeout.
   The test combines an imperative raw rotation with a scale target and explicit clearing.
   This is an adapter compatibility failure observed during the trial, not a proven
   upstream defect. Do not delete, skip or weaken that regression to accept the upgrade.
3. Restoring 13.4.4 made the transform suite and new bridge browser tests pass (7 tests).

The candidate pins and lockfile were restored. Activity sampler/stopDriver, scroll,
projection, drag release, WebKit and packed consumers were **not qualified on 14.2.0**.
The follow-up below repairs those two observed blockers. Before accepting an upgrade,
run the complete existing browser matrix, upstream contracts and independently installed consumers.
Prior 13.4.4 qualification must never be relabelled as Motion 14 evidence.

## Adapter repair follow-up: compatible fixes, unchanged qualified pins

The controlled follow-up trial uses the same exact 14.2.0 / utils 14.1.1 candidate.
Both previously observed blockers now pass their focused regressions:

- Late parent adoption walks the public VisualElement parent tree, stopping at
  `inherit: false`, and registers directly with the nearest variant node's public
  child set. Removal follows the old ancestor chain even if inheritance props
  changed after mount. An adapter-owned cleanup removes adopted registrations on
  child or parent teardown. Tests cover direct and intermediate inheritance boundaries,
  depth, parent membership and cleanup. Removed engine methods are no longer called.
- A newly animated independent channel masked by a raw transform starts from the
  engine's identity value, instead of trying to derive its initial value from the
  raw CSS matrix. Existing channels, static latest/base values and externally supplied values are
  preserved; identity is only the fallback for an absent channel.
  This avoids the observed Motion 14 instant grouped-transform completion stall.
  Tests retain the original raw-precedence/explicit-clear assertions and also
  require a nonzero-duration masked scale animation to start at identity, settle
  its promise and become visible only after explicit clearing.
- The strongest Humanspeak drag scenario was independently expressed using Astra's
  existing fixture: after one rendered move, a final move and pointerup occur before
  another frame. The final MotionValue, rendered position, single end callback and
  released drag lock all pass. Astra already flushes pending input on release;
  no drag implementation change or competitor source copying was necessary.

Candidate evidence in `/workspace/research/astra-catchup-20261021/adapter-repair/`:
`check-14.log` passes with no errors/warnings; `identity-14-candidate.log` passes
with 81 Motion DOM imports, seven Motion imports and 152 type imports. The latter
used temporary candidate pin metadata solely for the controlled gate, then restored
qualified metadata. `identity-14.log` records the expected initial rejection against
13's pin metadata before that controlled run. Chromium `focused-14.log` passes
16 tests (transform ownership and lazy features), `behavior-14.log` passes 57 tests
(visual ownership, gestures, state, animation guards, core contracts and CSS
transforms), and `final-focused-14.log` passes 13 tests including the final added
inheritance and nonzero-duration regressions. Firefox `focused-firefox-14.log`
passes all 30 focused transform, ownership and gesture tests. These runs overlap;
their counts must not be added as distinct test coverage.

Those candidate runs preceded two review refinements: preserving a static alias's
latest/base value before its MotionValue exists, and removing old variant membership
when `inherit` changes before adoption. The final versions of those refinements
were checked on retained 13 only: `review-edge-13.log` and
`review-edge-firefox-13.log` each pass all 15 transform/visual ownership tests.
The final diff therefore has not been rerun on Motion 14; earlier candidate evidence
must not be presented as qualification of those later refinements.

The exact Motion 13.4.4 / utils 13.3.0 pins and lockfile are retained. The reviewed
runtime import list adds only the public `defaultTransformValue` helper. Motion 14
is **not qualified**: the full browser matrix, activity/stopDriver, scroll, projection,
upstream contracts and independently installed consumers have not been qualified
on that candidate. The WebKit environment limitation remains unresolved. These
compatible adapter repairs are reviewable progress, not a broad parity claim.

## Adapter follow-up recorded checks

Working directory remains `/home/node/.t3/worktrees/astra-motion/t3-af7b8579`.
All commands below exited 0 on retained pins. Logs are in
`/workspace/research/astra-catchup-20261021/adapter-repair/`.

- `pnpm run check`: final `final-check-13.log`, no errors or warnings.
- `pnpm run lint`: final `final-lint-13.log`, Prettier and ESLint passed.
- `pnpm run check:guide`: `guide-13.log`, no errors or warnings.
- `node scripts/check-motion-upgrade.mjs`: `identity-13.log`, 81 Motion DOM
  imports, seven Motion imports and 152 type imports; one engine identity.
- `pnpm run test:server`: `server-13.log`, 300 tests in 64 files.
- `MOTION_BROWSER=chromium pnpm run test:browsers`: `chromium-13.log`,
  1,221 tests in 144 files, 569.51 seconds. This broad run began before the final
  review refinements; final affected-file qualification is recorded separately below.
- `MOTION_BROWSER=chromium pnpm run test:browsers src/lib/motion-lab/visual-ownership.svelte.spec.ts src/lib/motion-lab/transform-ownership.svelte.spec.ts`:
  `review-edge-13.log`, final 15 tests passed. The same command with
  `MOTION_BROWSER=firefox` passed 15 tests in `review-edge-firefox-13.log`.
- `MOTION_BROWSER=firefox pnpm run test:browsers src/lib/motion-lab/transform-ownership.svelte.spec.ts src/lib/motion-lab/visual-ownership.svelte.spec.ts src/lib/motion-lab/gestures.svelte.spec.ts`:
  `focused-firefox-13.log`, 30 tests before the final two review regressions.
- `pnpm run build`: `build-13.log`, static build, packaging and strict publint
  passed. The pre-existing lab-only `NativeInput` declaration and `import.meta.env`
  packaging warnings remain. The build began before the final review refinements;
  the following fresh packed consumer run checks the final library code.
- `node scripts/prepare-motion-consumer.mjs --output=/workspace/research/astra-catchup-20261021/adapter-repair/consumer-13.json`:
  `consumer-13.log`, both separately installed consumers passed source/declaration
  checks, builds, engine identity and dependency-boundary checks. Archive and
  dependency provenance are in `consumer-13.json` (dirty source based on `6638e81`).
- Svelte MCP autofixer: no issues/suggestions in the changed transform/visual test
  modules or added gesture scenario. Its suggestion to replace an existing plain
  test-fixture Map with SvelteMap was outside the change and is unnecessary because
  that fixture does not consume reactive Map reads.
- `git diff --check`: passed. Package manifest and lockfile compare byte-for-byte
  with the pre-trial retained-13 copies.

No new WebKit result, full Firefox run, production E2E matrix or candidate-14 packed
consumer qualification is claimed. No dependency patches, private deep imports,
prototype modifications, direct React dependencies or second engine were introduced.

## Verification scope

The new tests assert subscription disposal, borrowed identity, SSR behavior, live cycle
list changes, invalid inputs, reference resolution and complete copyable sources.
Existing documentation tests compile examples for client and server and require runnable
snippet previews. `check:guide` now follows local content imports and raw example sources
so sharing canonical migration content does not evade consumer checking.

No additional competitor tests were copied verbatim in this implementation. The prior
comparison commit contains the test audit and selected regression improvements; new
bridge tests exercise Astra's documented ownership contract.

## Original delivery recorded checks

Working directory: `/home/node/.t3/worktrees/astra-motion/t3-af7b8579`.
Logs and the qualified archive/consumer metadata are under
`/workspace/research/astra-catchup-20261021/`.

- `pnpm run check`: exit 0, no errors or warnings.
- `pnpm run lint`: exit 0, Prettier and ESLint passed.
- `pnpm run check:guide`: exit 0, no errors or warnings in the source consumer.
- `node scripts/check-motion-upgrade.mjs`: exit 0 on the retained pins;
  80 Motion DOM runtime imports, seven Motion imports, 152 type imports checked.
- `pnpm run test:server`: exit 0, 300 tests in 64 files.
- `node --test scripts/*.test.mjs`: exit 0, eight tests.
- `MOTION_BROWSER=chromium pnpm run test:browsers`: exit 0, 1,213 tests
  in 144 files, 505.68 seconds. Expected adversarial/derived-inert warnings were logged.
- `MOTION_BROWSER=firefox pnpm run test:browsers src/lib/motion-lab/core-bridges.svelte.spec.ts`:
  exit 0, two tests. The full Firefox suite was not rerun.
- `pnpm run build`: exit 0, static output and strict publint passed. Packaging emits
  a lab-only `NativeInput` declaration diagnostic and an `import.meta.env` warning;
  these do not invalidate the independently checked shipped declarations.
- `node scripts/prepare-motion-consumer.mjs --output=/workspace/research/astra-catchup-20261021/consumer.json`:
  exit 0. Separately installed plain Svelte and SvelteKit consumers passed source,
  declaration and build checks, engine identity and dependency-boundary checks.
- `node scripts/check-site-bundles.mjs`: exit 0, all three route budgets passed.
- Manual browser QA: six recipe cards; 375px layout without horizontal overflow;
  tilt opt-out preserves content; cycle button settles at 80px; range input produces
  opacity 0.5; docs endpoints return the expected content types and unknown versions 404.

WebKit's new-helper run did not execute tests: the container lacks its system libraries.
An isolated library extraction was attempted without installing system packages; the
bundled WebKit launcher replaces its library path and still fails to load GStreamer.
This is an environment limitation, not a passing WebKit result. No full browser matrix,
production E2E matrix or Motion 14 behavioral qualification is claimed.
