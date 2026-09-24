# Motion 13.4 upgrade qualification

Registry versions were checked on 2026-09-24. The exact build graph is `motion@13.4.3`,
`framer-motion@13.4.3`, `motion-dom@13.4.2`, and `motion-utils@13.3.0`.
The packages do not share one release number. All four are now checked as exact
pins by the upgrade gate; consumers continue to receive one bundled DOM-only engine.

The [official upgrade guide](https://motion.dev/docs/upgrade-guide) documents no
JavaScript breaking changes in version 13. Astra also integrates undocumented
projection and playback interfaces, so its migration needs additional checks.
The [upstream changelog](https://github.com/motiondivision/motion/blob/main/CHANGELOG.md)
describes the 13.3 animation/spring improvements and 13.4 fixes.

## Adapter changes

- `MotionValue.animation` now has the narrower `MotionValueAnimation` type because
  spring followers do not implement all playback controls. Handoff accepts that
  interface and preserves the existing runtime class guards; tests requiring
  `complete()` or duration controls narrow to `AsyncMotionValueAnimation` first.
- Plain DOM `animate()` now uses shared style/SVG effects instead of creating a
  `VisualElement`. Scoped timelines flush those effect queues before releasing
  ownership so a queued old endpoint cannot overwrite a replacement animation.
  Retargeting recognizes the effect's existing transform as engine-owned.
- The new effect imports and their identity across Motion package roots are included
  in the upgrade gate. Browser contracts check `get()` and `flush()` availability.
- Height keyframe resolution now reads computed styles. The upstream getter
  reproduction and presence handoff regression count those reads, preserving the
  assertion that handoff must not synchronously resolve another element's keyframes.
- Current installation/status pages reflect bundled-engine delivery and strict
  consumer types. Historical reports retain their original versions and results.

The cancellation and scroll-listener defects reproduced by the upstream suite still
exist in this release. The private cancellation shim and information-callback scroll
strategy remain necessary. Packaging still removes the unsupported Electron-only
`webview` declaration; upstream runtime code is not patched.

## Repeat the checks

Run `pnpm check`, `pnpm lint`, `node scripts/check-motion-upgrade.mjs`,
`pnpm test:server`, `pnpm test:browsers`, `pnpm build`, and
`node scripts/prepare-motion-consumer.mjs`. The independent consumer checks declarations
with `skipLibCheck: false` and verifies that no separately resolved Motion or React
runtime is installed.

The upstream harness accepts `UPSTREAM_MOTION_URL` to use a manager-owned preview
instead of starting its own server. With the manager's allocated local URL set,
run `pnpm exec playwright test --config tests/upstream-motion/playwright.config.ts`;
`--config` selects the independent upstream contract suite.

## Recorded verification

- Svelte check: 0 errors, 0 warnings; lint, guide check, upgrade gate and upstream
  harness typecheck pass.
- Server suite: 110 tests pass. Full Chromium component suite: 315 tests pass.
- Migration-focused component suites: 80 tests each pass in Firefox and WebKit,
  including HTML/SVG handoff, timeline retargeting, completion, cancellation and spring followers.
- Upstream contracts: all four cases pass in Chromium, Firefox and WebKit.
- Production build, prepack and strict publint pass. The independent packed consumer
  passes Svelte checks, strict TypeScript declarations and its production build.
- The upstream page was exercised through the shared Chrome browser; console and
  network checks were clean after adding a self-contained favicon to the fixture.
  The built status and getting-started pages also passed console/network checks, and
  the getting-started notification demo completed its exit.

WebKit used locally extracted Linux shared libraries because the container lacks its
system dependencies. Browser behavior passed; this is not physical Safari/iOS testing.
The existing Svelte packaging warning about `import.meta.env` remains unrelated to
this dependency migration; strict package and consumer validation still pass.
