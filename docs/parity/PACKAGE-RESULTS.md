# Installed package qualification

Current follow-up: [independent audit of ef77bf8](RELEASE-AUDIT.md). The record
below describes the earlier release; its archive measurements and review conclusions
do not qualify the corrected runtime.

Status: **bounded installed-package qualification passed**, 2026-09-28 UTC. Both installed consumers pass strict declarations and production builds. Full Chromium/Firefox results and focused reruns are recorded against their actual archives below; they are not presented as one identical-candidate run. The default CI job runs both complete consumers in every browser.

## Source and archive identity

The corrected runtime was copied byte-for-byte from integration commit **`8ea3543979870e0ede58797875b30b468e1fba06`**. Its packed archive SHA-256 is **`faed8fb4eabedaabd122f5126594b0871d2948d9aa8c037003c2ba18ccb7cfd6`**. The isolated packaging worktree itself remains based on `b66e376d9f80bab62768c4b1569f4eef9d11dd95` with uncommitted copied changes; metadata explicitly records that fact and the copied-runtime hash rather than claiming the worker was at the integration commit.

The preceding archive, **`aeac14f72bc620fa37ef6a015edb60f31b2d495d9c80ac7ae40fb90badb3d2ad`**, contains the frozen runtime from `63721c14ea745934bde92136e5020f050c43bda6`. Its complete Chromium and Firefox evidence is retained. A final source check found an Activity pause defect in upstream JSAnimation, so that archive was superseded. The corrected archive differs in exactly seven files: `animation-controls.svelte.js`, `motion-core.svelte.js`, `presence-context.svelte.js`, `use-animate.svelte.js`, `motion-compat.js` and the private `motion-compat.d.ts` / `animation-ownership.d.ts` declarations. Public entry declarations and all other archive files are byte-identical. Changed runtime received focused installed reruns; the complete exact-candidate matrix remains the default CI gate.

The engine baseline is exactly Motion/framer-motion/motion-dom **13.4.4**, motion-utils **13.3.0**. The package verifier checks vendored versions, actual import statements, compatible class/scheduler identity, installed bytes against the archive and absence of React. The final reviewed integration uses 71 motion-dom and 7 Motion runtime symbols; public and isolated private compatibility contracts are recorded in `tests/upstream-motion/reviewed-exports.json`.

## Installed checks

Both applications install the actual archive produced by `pnpm pack`, with no Astra source alias. The plain application has no SvelteKit, React or upstream Motion installation. Its generic public imports resolve independently; the separate Kit application owns the optional routing integrations. Runtime inventories explicitly review all **19 public entries**.

On the corrected archive, both applications passed svelte-check with **zero errors and warnings**, strict TypeScript with **`skipLibCheck: false`**, and production builds. Plain Svelte built seven separate client/server applications. Tests cover managed helper inference, configuration, callbacks, scoped subjects, rejected invalid options, native attrs/events/bindings, known HTML/SVG factories, namespaced anchors, custom required props and precise SVG refs. The native SVG SMIL `values` attribute remains typed and forwarded.

| Archive                   | Browser                | Plain Svelte                   | SvelteKit                          |
| ------------------------- | ---------------------- | ------------------------------ | ---------------------------------- |
| Pre-correction `aeac14f7` | Chromium 151.0.7922.34 | 7/7 fixtures passed            | 14/14 cases passed                 |
| Pre-correction `aeac14f7` | Firefox 153.0          | 7/7 fixtures passed            | 14/14 cases passed                 |
| Corrected `faed8fb4`      | Chromium 151.0.7922.34 | Affected Parity fixture passed | Earlier complete evidence retained |
| Corrected `faed8fb4`      | Firefox 153.0          | Affected Parity fixture passed | Earlier complete evidence retained |
| Corrected `faed8fb4`      | WebKit 26.5            | 7/7 fixtures passed            | 14/14 cases passed                 |

The Parity fixture covers SSR/hydration, derived values, native SVG SMIL values, presence completion, retained Activity input, paused/resumed frame work, owned animation/subscription cleanup, asynchronous view fallback, trusted external dragging with focus transfer, and a controlled list reordered twice during one held pointer. Other fixtures verify eager behavior, actual deferred network requests, pre-hydration input and DOM/ref identity, the latest pending target, synchronous features and hybrid/mini playback settlement. Kit preserves the legacy state/layout/presence/route regressions and adds isolated view-navigation fallback. Browser runs check console/network errors and compare served JavaScript with built asset bytes.

All local qualification servers, contexts and browsers were closed; the shared WebKit wrappers were restored after the final run.

The integration owner additionally passed all **18 affected Activity/borrowed-playback source checks across the three browsers** after the pause correction. Those are source-suite evidence, not invented extra consumer cases. Source-wide tests, independent review, production documentation checks, remote CI and deployment are recorded by the integration owner.

## Production bundles

These are **independent complete test applications**, including Svelte and fixture bootstrap. Initial shared chunks count once in each application. Compressed totals sum separately compressed HTTP assets; separate fixture totals are not additive or library-only sizes. All sizes below are bytes. Minified output comes from Vite; compression uses Node zlib's default gzipSync and brotliCompressSync options.

| Fixture                    | Initial minified | Initial gzip | Initial Brotli | Deferred minified | Deferred gzip | Deferred Brotli |
| -------------------------- | ---------------: | -----------: | -------------: | ----------------: | ------------: | --------------: |
| Eager motion.div           |          200,742 |       67,944 |         60,486 |                 0 |             0 |               0 |
| Deferred basic features    |           71,826 |       26,461 |         23,955 |            83,733 |        28,923 |          26,304 |
| Deferred full features     |           71,937 |       26,518 |         23,909 |           140,937 |        46,433 |          41,306 |
| Synchronous basic features |          147,619 |       51,896 |         46,731 |                 0 |             0 |               0 |
| Hybrid useAnimate          |           96,262 |       34,721 |         31,549 |                 0 |             0 |               0 |
| Mini useAnimate            |           42,330 |       16,227 |         14,740 |                 0 |             0 |               0 |

The actual build tools were Node **24.20.0**, pnpm **11.24.0**, Svelte **5.57.0**, Vite **8.2.2**, its Svelte plugin **7.3.0**, TypeScript **6.0.3**, and Rolldown **1.2.11**. Compression versions and asset hashes are retained in the [machine-readable bundle summary](packed-bundle-results.json).

All graph assertions pass: no React, no second engine, no animation/VisualElement/gesture/projection-node implementations in deferred initial assets, no drag/pan or projection nodes in basic features, and no hybrid sequence/VisualElement/JSAnimation implementation in mini. Basic features retain only the small shared drag-active flag used by hover/press arbitration. Small geometry and scale-corrector utilities are allowed before feature loading. Module lists identify chunks containing Svelte rather than subtracting an assumed Svelte size.

## Defects found and corrected

1. The old dependency checker confused the ordinary prop name `motion` with an upstream import. It now parses import/export/import-type/dynamic-import/require syntax, including both Svelte scripts; dedicated tests preserve the distinction.
2. Initial ambiguous HTML/SVG declarations exceeded TypeScript's union-complexity limit in eight emitted files. A shared mapped native-property record preserves event/ref typing without the exponential union. Both consumers' strict checks pass.
3. A capturing window blur listener ended external dragging during ordinary button focus transfer. The trusted consumer now reaches the exact hard constraint before release and reports one completion.
4. Explicit pointer capture was lost when Svelte moved a keyed Reorder item. Primary components now follow upstream PanSession's window pointer listeners; the trusted consumer completes both staged swaps while held. Legacy createMotion capture policy remains separately covered.
5. Deferred features with initial:false retained the old target. Delayed materialization now resolves the latest pose while preserving the original input/DOM/ref. Both complete Chromium/Firefox runs pass that installed regression.
6. Upstream JSAnimation.pause retained a driver and could change a hidden arc once more. The qualified compatibility helper commits the held sample synchronously and releases the driver; resumed playback preserves identity. The private stopDriver contract requires requalification on engine upgrades. The corrected archive's focused installed and source Activity checks pass.

## Reproduction, artifacts and CI

```sh
node scripts/prepare-motion-consumer.mjs --output=/tmp/astra-consumer.json
MOTION_BROWSER=chromium node scripts/qualify-packed-motion-ci.mjs /tmp/astra-consumer.json artifacts/packed-consumer
```

`--output` gives concurrent runs separate provenance files. `MOTION_BROWSER` selects one allocated CI engine; omit it to run all three. Both commands default to both complete consumers. `--consumer=plain` or `--consumer=kit` selects a focused diagnostic; `--consumer=plain --fixture=Parity` additionally selects the affected composition fixture, with a distinct result filename. The runner owns and closes temporary loopback servers, contexts and browsers.

Local evidence for the preceding full Chromium/Firefox runs is `/tmp/astra-final-package-artifacts/`; corrected results, source hashes, archive comparison and full module/chunk graphs are in `/tmp/astra-corrected-package-artifacts/`. Setup files `/tmp/astra-final-package.json` and `/tmp/astra-corrected-package.json` identify the independently installed consumers and archives. These local paths are diagnostic artifacts, not permanent deployed links.

The CI matrix runs both complete packed consumers in Chromium, Firefox and WebKit and uploads the same JSON results, graphs, compressed sizes, screenshots and failure HTML as `packed-consumer-<browser>` artifacts. Existing source-browser and production E2E matrices remain intact. Local success does not claim that remote CI or deployment has already completed.

Tooling unit checks pass **4/4**; targeted ESLint, formatting, Svelte autofixer and diff checks pass. See [consumer instructions](../../tests/production/README.md), [helper parity evidence](values-audit.md), and the final integration matrix for complementary verification.
