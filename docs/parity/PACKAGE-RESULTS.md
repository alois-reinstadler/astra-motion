# Installed package qualification

Status: **final integrated candidate pending**, 2026-09-28 UTC. This report covers uncommitted parity work based on `b66e376d9f80bab62768c4b1569f4eef9d11dd95`; it is not a published-release claim. The final archive must include the composition/factory changes and deferred-loading correction, then pass the single final consumer matrix.

## Qualification contract

Both consumers install the archive produced by `pnpm pack`, with no Astra source alias. `tests/production/plain-consumer` has no SvelteKit, React, or upstream Motion dependency. The existing SvelteKit consumer preserves its legacy state, layout, presence and route regressions and adds the isolated view-navigation integration. Runtime inventories explicitly review all 19 public entries; strict declarations use `skipLibCheck: false` and include rejected invalid usage.

The baseline is exactly Motion/framer-motion/motion-dom **13.4.4**, motion-utils **13.3.0**, Svelte **5.57.0**. The package verifier checks vendored versions, actual import statements, compatible class/scheduler identity, installed bytes against the archive and absence of React. The plain consumer independently pins Vite 8.2.2, its Svelte plugin 7.3.0, TypeScript 6.0.3 and svelte-check 4.7.6. Bundle evidence records the actual Node, pnpm, Rolldown and compression-library versions too.

The production graph checks cover eager motion, deferred basic/full features, synchronous basic features, hybrid useAnimate and mini useAnimate. Each result is a complete independent application including Svelte and fixture bootstrap. Shared initial chunks count once; compressed totals sum separately compressed assets. These are not library-only sizes. The graph checks reject React, a second engine, eager feature implementations in deferred initial assets, drag/pan or projection nodes in basic features, and hybrid sequence/VisualElement/JSAnimation implementations in mini. Basic features retain only the small shared drag-active flag used by hover/press arbitration.

## Executed evidence and remaining gate

- Candidate `0227a520004f962f3a9317096e252b563e99005eb0714d3a06c23e283667a6b5`: both installed consumers passed svelte-check with zero errors/warnings, strict declaration checks and production builds. The plain consumer built seven separate SSR/client fixtures. Its graph assertions passed. The SvelteKit Chromium qualification passed **14 cases**, including the reviewed 19-entry runtime inventory and navigation fallback.
- Candidate `39cdbd69767aca896f543156c3aa39bba68b92f7d2d172e7bf8d735bbcbd999b`: the plain consumer again passed strict checks and all seven SSR/client builds. The installed Chromium `Parity` case passed SSR/hydration, derived values, native SVG SMIL `values`, presence completion, retained Activity input, frame/subscription/animation cleanup, asynchronous view fallback, a trusted external drag handle and a trusted two-swap controlled Reorder interaction. The eager initial:false case passed.
- The next deferred-basic case exposed an unresolved candidate issue: changing the target from 20 to 80 before asynchronous features arrive, with initial:false, leaves the rendered translation at 20 after loading. No console or network errors occurred. The integration owner corrected delayed initial:false materialization and passed the new focused Chromium regression; the exact installed assertion awaits the final archive. Remaining deferred/full/mini/hybrid runtime cases and Firefox/WebKit checks have not been passed off as completed by this partial run.
- Additional strict native-factory and custom-SVG-ref cases now cover the reviewed final factory contract. They await the final installed archive. Svelte autofixer reports no issues/suggestions for the updated binding fixture.
- Tooling unit checks pass **4/4**. Targeted ESLint and formatting checks passed for the owned tooling and fixtures. The upgraded upstream-symbol qualification passed **66 motion-dom runtime symbols, 7 motion runtime symbols, 119 type symbols and 442 source files** before the final composition snapshot; additions from that snapshot must be reviewed before its final pack.

Final evidence will replace these candidate rows with one archive SHA, the exact source revision/dirty state, full browser totals, bundle measurements and artifact references. Independent adversarial review, release-wide tests, final polish and deployment remain integration-owner gates.

## Defects caught by installed consumers

1. The old dependency checker confused the ordinary prop name `motion` with an upstream import. It now parses import/export/import-type/dynamic-import/require syntax, including both Svelte scripts; regression tests preserve the distinction.
2. The initial ambiguous HTML/SVG declarations exceeded TypeScript's union-complexity limit in eight emitted files. A shared mapped native-property record preserves event/ref typing without the exponential union. Both consumers' strict checks passed the corrected declarations.
3. A capturing window blur listener ended external dragging when ordinary focus moved between buttons. The runtime now distinguishes real window blur from descendant focus transfer; the trusted consumer drag reaches its exact hard constraint before release and reports one completion.
4. Explicit pointer capture was lost when Svelte moved a keyed Reorder item. Primary components now follow upstream PanSession's window pointer listeners; the trusted consumer completes both staged swaps while held, then releases. Legacy createMotion capture policy remains separately covered.
5. Deferred features with initial:false retain an old initial target. The source correction and focused regression pass are recorded by the integration owner; final installed verification remains pending.

## Reproduction and CI

```sh
node scripts/prepare-motion-consumer.mjs --output=/tmp/astra-consumer.json
MOTION_BROWSER=chromium node scripts/qualify-packed-motion-ci.mjs /tmp/astra-consumer.json artifacts/packed-consumer
```

`--output` gives concurrent qualification runs separate provenance files. `MOTION_BROWSER` selects one allocated CI engine; omit it to run Chromium, Firefox and WebKit. Both commands default to both consumers; `--consumer=plain` or `--consumer=kit` selects a focused diagnostic. The runner owns and closes temporary loopback servers, browser contexts and browsers. It checks console/network errors and compares served JavaScript with built bytes.

The added CI matrix runs both packed consumers in all three browsers and uploads JSON results, module/chunk graphs, compressed sizes, screenshots and failure HTML. The existing source-browser and production E2E matrices remain intact. A successful local run does not claim that the remote workflow has already run.

See [the consumer instructions](../../tests/production/README.md), [helper parity evidence](values-audit.md) and the final integration matrix for complementary checks.
