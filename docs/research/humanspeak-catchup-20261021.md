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

## Motion 14 trial: retain 13.4.4

Tested exact `motion`, `motion-dom`, `framer-motion` 14.2.0 and
`motion-utils` 14.1.1, matching the inspected Humanspeak dependency baseline.
All imported export names existed and the package identity gate passed. That was
insufficient evidence of compatibility:

1. `pnpm run check` failed because `VisualElement.getClosestVariantNode` and
   `VisualElement.addVariantChild` were removed. Astra's late parent adoption calls
   them in `src/lib/motion/visual.ts`. Motion 14 inlines ancestry traversal during mount;
   a future port must preserve inheritance boundaries and adoption/unmount cleanup.
2. A focused Chromium run passed 49 tests and failed the existing transform ownership
   case `retains raw-transform precedence until it is explicitly cleared` by timeout.
   The test combines an imperative raw rotation with a scale target and explicit clearing.
   This is an adapter compatibility failure observed during the trial, not a proven
   upstream defect. Do not delete, skip or weaken that regression to accept the upgrade.
3. Restoring 13.4.4 made the transform suite and new bridge browser tests pass (7 tests).

The candidate pins and lockfile were restored. Activity sampler/stopDriver, scroll,
projection, drag release, WebKit and packed consumers were **not qualified on 14.2.0**.
Before accepting a future upgrade, repair the two observed blockers and run the complete
existing browser matrix, upstream contracts and independently installed consumers.
Prior 13.4.4 qualification must never be relabelled as Motion 14 evidence.

## Verification scope

The new tests assert subscription disposal, borrowed identity, SSR behavior, live cycle
list changes, invalid inputs, reference resolution and complete copyable sources.
Existing documentation tests compile examples for client and server and require runnable
snippet previews. `check:guide` now follows local content imports and raw example sources
so sharing canonical migration content does not evade consumer checking.

No additional competitor tests were copied verbatim in this implementation. The prior
comparison commit contains the test audit and selected regression improvements; new
bridge tests exercise Astra's documented ownership contract.

## Recorded checks

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
